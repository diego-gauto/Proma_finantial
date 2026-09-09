import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const workflowId = "proyecto1DriveIncrementalSync";
const workflowName = "Proyecto 1 - Sync incremental Google Drive";

const postgresCredentials = {
  postgres: {
    id: "PgFinanzasP1Cred",
    name: "Postgres Finanzas Proyecto 1",
  },
};

const googleDriveCredentials = {
  googleDriveOAuth2Api: {
    id: "VzZlfgxu2EeOdQLH",
    name: "Google Drive account",
  },
};

const [manualWorkflow] = JSON.parse(
  readFileSync(
    "docs/n8n/2026-09-07-manual-processing-workflow-source.json",
    "utf8",
  ),
);

function cloneManualNode(name, overrides = {}) {
  const node = manualWorkflow.nodes.find((candidate) => candidate.name === name);
  if (!node) {
    throw new Error(`Manual workflow node not found: ${name}`);
  }

  return {
    ...structuredClone(node),
    ...overrides,
    parameters: {
      ...structuredClone(node.parameters || {}),
      ...(overrides.parameters || {}),
    },
  };
}

function replaceAllText(value, replacements) {
  let result = value;
  for (const [from, to] of replacements) {
    result = result.split(from).join(to);
  }
  return result;
}

const syncSql = `WITH payload AS (
  SELECT
    $1::jsonb AS body,
    $2::text AS previous_token
),
raw_changes AS (
  SELECT
    change_item.value AS raw_change,
    change_item.value->>'fileId' AS drive_id,
    NULLIF(change_item.value->>'changeId', '') AS change_id,
    COALESCE((change_item.value->>'removed')::boolean, false) AS removed,
    NULLIF(change_item.value->>'time', '')::timestamptz AS change_time,
    change_item.value->'file' AS file_metadata
  FROM payload
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(payload.body->'changes', '[]'::jsonb)) AS change_item(value)
),
parsed AS (
  SELECT
    r.raw_change,
    r.drive_id,
    r.change_id,
    r.removed,
    r.change_time,
    r.file_metadata,
    COALESCE(r.file_metadata->>'name', '[removed]') AS new_name,
    COALESCE(r.file_metadata->>'mimeType', 'application/octet-stream') AS mime_type,
    CASE WHEN r.file_metadata->>'mimeType' = 'application/vnd.google-apps.folder' THEN 'folder' ELSE 'file' END AS item_type,
    NULLIF(r.file_metadata->'parents'->>0, '') AS new_parent_drive_id,
    COALESCE((r.file_metadata->>'trashed')::boolean, r.removed) AS trashed,
    NULLIF(r.file_metadata->>'modifiedTime', '')::timestamptz AS modified_time,
    NULLIF(r.file_metadata->>'md5Checksum', '') AS md5_checksum,
    NULLIF(r.file_metadata->>'webViewLink', '') AS web_view_link,
    NULLIF(r.file_metadata->>'size', '')::bigint AS size_bytes
  FROM raw_changes r
  WHERE r.drive_id IS NOT NULL
),
scope_state AS (
  SELECT root_folder_id
  FROM drive_sync_state
  WHERE scope = 'documents_root'
),
with_existing AS (
  SELECT
    p.*,
    existing.name AS old_name,
    existing.parent_drive_id AS old_parent_drive_id,
    existing.drive_path AS old_drive_path,
    existing.trashed AS old_trashed,
    existing.within_root AS old_within_root,
    existing.category_node_id AS old_category_node_id,
    parent_item.category_node_id AS parent_category_node_id,
    parent_item.drive_path AS parent_drive_path,
    related.id AS current_document_id,
    duplicate_active.id AS duplicate_active_document_id,
    duplicate_inactive.id AS duplicate_inactive_document_id,
    (
      p.new_parent_drive_id = scope_state.root_folder_id
      OR existing.drive_id IS NOT NULL
      OR parent_item.within_root IS TRUE
    ) AS detected_within_root
  FROM parsed p
  CROSS JOIN scope_state
  LEFT JOIN drive_items existing ON existing.drive_id = p.drive_id
  LEFT JOIN drive_items parent_item ON parent_item.drive_id = p.new_parent_drive_id
  LEFT JOIN documents related ON related.drive_item_id = p.drive_id
  LEFT JOIN LATERAL (
    SELECT d.id
    FROM documents d
    WHERE p.md5_checksum IS NOT NULL
      AND (
        d.content_hash = p.md5_checksum
        OR d.drive_md5_checksum = p.md5_checksum
      )
      AND d.active = true
      AND d.drive_item_id IS DISTINCT FROM p.drive_id
    ORDER BY d.id
    LIMIT 1
  ) duplicate_active ON true
  LEFT JOIN LATERAL (
    SELECT d.id
    FROM documents d
    WHERE p.md5_checksum IS NOT NULL
      AND (
        d.content_hash = p.md5_checksum
        OR d.drive_md5_checksum = p.md5_checksum
      )
      AND d.active = false
    ORDER BY d.id
    LIMIT 1
  ) duplicate_inactive ON true
),
classified AS (
  SELECT
    w.*,
    CASE
      WHEN w.removed OR w.trashed THEN 'trashed'
      WHEN w.detected_within_root IS NOT TRUE THEN 'removed_from_scope'
      WHEN w.old_name IS NULL AND w.duplicate_active_document_id IS NOT NULL THEN 'duplicate_candidate'
      WHEN w.old_name IS NULL AND w.duplicate_inactive_document_id IS NOT NULL THEN 'restored'
      WHEN w.old_name IS NULL THEN 'created'
      WHEN w.old_trashed = true AND w.trashed = false THEN 'restored'
      WHEN w.old_parent_drive_id IS DISTINCT FROM w.new_parent_drive_id THEN 'moved'
      WHEN w.old_name IS DISTINCT FROM w.new_name THEN 'renamed'
      ELSE 'metadata_changed'
    END AS event_type,
    COALESCE(w.md5_checksum, NULL) AS content_hash,
    CASE
      WHEN w.old_name IS NULL AND w.duplicate_active_document_id IS NOT NULL THEN true
      WHEN w.old_name IS NULL AND w.duplicate_inactive_document_id IS NOT NULL THEN true
      WHEN w.detected_within_root IS NOT TRUE THEN true
      ELSE false
    END AS review_required,
    CASE
      WHEN w.old_name IS NULL AND w.duplicate_active_document_id IS NOT NULL THEN 'El hash ya existe en un documento activo; requiere decision humana.'
      WHEN w.old_name IS NULL AND w.duplicate_inactive_document_id IS NOT NULL THEN 'El hash coincide con un documento inactivo; posible restitucion.'
      WHEN w.detected_within_root IS NOT TRUE THEN 'Cambio detectado fuera del alcance conocido o con carpeta padre desconocida.'
      ELSE NULL
    END AS review_reason,
    COALESCE(
      w.current_document_id,
      w.duplicate_active_document_id,
      w.duplicate_inactive_document_id
    ) AS related_document_id
  FROM with_existing w
),
normalized AS (
  SELECT
    c.*,
    (regexp_match(c.new_name, '\\m(0?[1-9]|1[0-2])\\s*[-_]\\s*(0?[1-9]|1[0-2])\\s*[-_ ]+\\s*(20\\d{2}|\\d{2})\\M')) AS fiscal_range_match,
    (regexp_match(c.new_name, '\\m(0?[1-9]|1[0-2])[-_ ]?(20\\d{2}|\\d{2})\\M')) AS fiscal_single_match
  FROM classified c
),
document_payload AS (
  SELECT
    n.*,
    COALESCE(n.parent_drive_path || '/' || n.new_name, n.new_name) AS new_drive_path,
    CASE
      WHEN n.fiscal_range_match IS NOT NULL THEN
        CASE
          WHEN (n.fiscal_range_match)[3]::integer < 100 THEN (n.fiscal_range_match)[3]::integer + 2000
          ELSE (n.fiscal_range_match)[3]::integer
        END
      WHEN n.fiscal_single_match IS NOT NULL THEN
        CASE
          WHEN (n.fiscal_single_match)[2]::integer < 100 THEN (n.fiscal_single_match)[2]::integer + 2000
          ELSE (n.fiscal_single_match)[2]::integer
        END
      ELSE 2026
    END::smallint AS fiscal_period_year,
    CASE
      WHEN n.fiscal_range_match IS NOT NULL THEN GREATEST((n.fiscal_range_match)[1]::integer, (n.fiscal_range_match)[2]::integer)
      WHEN n.fiscal_single_match IS NOT NULL THEN (n.fiscal_single_match)[1]::integer
      ELSE NULL
    END::smallint AS fiscal_period_month,
    CASE
      WHEN n.fiscal_range_match IS NOT NULL OR n.fiscal_single_match IS NOT NULL THEN 'month'
      ELSE 'year'
    END AS fiscal_period_kind,
    CASE
      WHEN n.fiscal_range_match IS NOT NULL THEN ARRAY(
        SELECT generate_series(
          LEAST((n.fiscal_range_match)[1]::integer, (n.fiscal_range_match)[2]::integer),
          GREATEST((n.fiscal_range_match)[1]::integer, (n.fiscal_range_match)[2]::integer)
        )
      )
      WHEN n.fiscal_single_match IS NOT NULL THEN ARRAY[(n.fiscal_single_match)[1]::integer]
      ELSE NULL
    END AS covered_fiscal_months
  FROM normalized n
),
upsert_items AS (
  INSERT INTO drive_items (
    drive_id,
    name,
    mime_type,
    item_type,
    parent_drive_id,
    drive_path,
    within_root,
    trashed,
    modified_time,
    md5_checksum,
    content_hash,
    content_hash_algorithm,
    web_view_link,
    size_bytes,
    category_node_id,
    last_seen_at,
    last_event_type,
    raw_metadata
  )
  SELECT
    d.drive_id,
    d.new_name,
    d.mime_type,
    d.item_type,
    d.new_parent_drive_id,
    d.new_drive_path,
    COALESCE(d.detected_within_root, false),
    d.trashed,
    d.modified_time,
    d.md5_checksum,
    d.md5_checksum,
    CASE WHEN d.md5_checksum IS NOT NULL THEN 'drive_md5' ELSE NULL END,
    d.web_view_link,
    d.size_bytes,
    CASE
      WHEN d.item_type = 'file' THEN COALESCE(d.parent_category_node_id, d.old_category_node_id)
      ELSE d.old_category_node_id
    END,
    now(),
    d.event_type,
    COALESCE(d.file_metadata, '{}'::jsonb)
  FROM document_payload d
  ON CONFLICT (drive_id) DO UPDATE SET
    name = EXCLUDED.name,
    mime_type = EXCLUDED.mime_type,
    item_type = EXCLUDED.item_type,
    parent_drive_id = EXCLUDED.parent_drive_id,
    within_root = EXCLUDED.within_root,
    trashed = EXCLUDED.trashed,
    modified_time = EXCLUDED.modified_time,
    md5_checksum = EXCLUDED.md5_checksum,
    content_hash = EXCLUDED.content_hash,
    content_hash_algorithm = EXCLUDED.content_hash_algorithm,
    web_view_link = EXCLUDED.web_view_link,
    size_bytes = EXCLUDED.size_bytes,
    drive_path = EXCLUDED.drive_path,
    category_node_id = CASE
      WHEN EXCLUDED.item_type = 'file' THEN EXCLUDED.category_node_id
      ELSE COALESCE(drive_items.category_node_id, EXCLUDED.category_node_id)
    END,
    last_seen_at = EXCLUDED.last_seen_at,
    last_event_type = EXCLUDED.last_event_type,
    raw_metadata = drive_items.raw_metadata || EXCLUDED.raw_metadata
  RETURNING drive_id
),
created_documents AS (
  INSERT INTO documents (
    drive_file_id,
    drive_url,
    file_name,
    drive_path,
    category_node_id,
    fiscal_period_year,
    fiscal_period_month,
    fiscal_period_kind,
    covered_fiscal_months,
    extracted_data,
    processing_status,
    processing_error,
    content_hash,
    content_hash_algorithm,
    drive_md5_checksum,
    drive_parent_id,
    active,
    review_reason,
    last_seen_at,
    drive_item_id
  )
  SELECT
    d.drive_id,
    d.web_view_link,
    d.new_name,
    d.new_drive_path,
    COALESCE(d.parent_category_node_id, d.old_category_node_id, resolve_category_node(ARRAY['Sin categoria'])),
    d.fiscal_period_year,
    d.fiscal_period_month,
    d.fiscal_period_kind,
    d.covered_fiscal_months,
    jsonb_strip_nulls(jsonb_build_object(
      'stage', 'drive_incremental_sync',
      'source_kind', 'drive_event_created',
      'mime_type', d.mime_type,
      'size', d.size_bytes,
      'drive_parent_id', d.new_parent_drive_id,
      'md5Checksum', d.md5_checksum,
      'drive_md5_checksum', d.md5_checksum,
      'content_hash', d.content_hash,
      'content_hash_algorithm', CASE WHEN d.content_hash IS NOT NULL THEN 'drive_md5' ELSE NULL END,
      'review_reasons', jsonb_build_array('pending_document_extraction'),
      'raw_drive_change', d.raw_change
    )),
    'review_required',
    NULL,
    d.content_hash,
    CASE WHEN d.content_hash IS NOT NULL THEN 'drive_md5' ELSE NULL END,
    d.md5_checksum,
    d.new_parent_drive_id,
    true,
    'Nuevo archivo detectado; pendiente de extraccion documental.',
    now(),
    d.drive_id
  FROM document_payload d
  WHERE d.event_type = 'created'
    AND d.item_type = 'file'
  ON CONFLICT (drive_file_id) DO UPDATE SET
    drive_url = COALESCE(EXCLUDED.drive_url, documents.drive_url),
    file_name = EXCLUDED.file_name,
    drive_path = EXCLUDED.drive_path,
    drive_parent_id = COALESCE(EXCLUDED.drive_parent_id, documents.drive_parent_id),
    content_hash = COALESCE(EXCLUDED.content_hash, documents.content_hash),
    content_hash_algorithm = COALESCE(EXCLUDED.content_hash_algorithm, documents.content_hash_algorithm),
    drive_md5_checksum = COALESCE(EXCLUDED.drive_md5_checksum, documents.drive_md5_checksum),
    drive_item_id = COALESCE(EXCLUDED.drive_item_id, documents.drive_item_id),
    active = true,
    removed_at = NULL,
    removed_reason = NULL,
    review_reason = CASE
      WHEN documents.processing_status = 'processed' THEN documents.review_reason
      ELSE EXCLUDED.review_reason
    END,
    processing_status = CASE
      WHEN documents.processing_status = 'processed' THEN documents.processing_status
      ELSE 'review_required'
    END,
    extracted_data = documents.extracted_data || EXCLUDED.extracted_data,
    last_seen_at = now()
  RETURNING id, drive_item_id
),
trashed_documents AS (
  UPDATE documents d
  SET
    active = false,
    removed_at = COALESCE(d.removed_at, now()),
    removed_reason = 'trashed',
    review_reason = COALESCE(d.review_reason, 'Archivo marcado como eliminado o enviado a papelera en Drive.'),
    last_seen_at = now()
  FROM document_payload p
  WHERE p.event_type = 'trashed'
    AND d.drive_item_id = p.drive_id
    AND d.active = true
  RETURNING d.id
),
out_of_scope_documents AS (
  UPDATE documents d
  SET
    active = false,
    removed_at = COALESCE(d.removed_at, now()),
    removed_reason = 'moved_out_of_scope',
    review_reason = COALESCE(d.review_reason, 'Archivo movido fuera del alcance controlado en Drive.'),
    drive_parent_id = COALESCE(p.new_parent_drive_id, d.drive_parent_id),
    last_seen_at = now()
  FROM document_payload p
  WHERE p.event_type = 'removed_from_scope'
    AND d.drive_item_id = p.drive_id
    AND d.active = true
  RETURNING d.id
),
restored_documents AS (
  UPDATE documents d
  SET
    active = true,
    removed_at = NULL,
    removed_reason = NULL,
    review_reason = NULL,
    file_name = COALESCE(p.new_name, d.file_name),
    drive_url = COALESCE(p.web_view_link, d.drive_url),
    drive_path = COALESCE(p.new_drive_path, d.drive_path),
    category_node_id = COALESCE(p.parent_category_node_id, d.category_node_id),
    drive_parent_id = COALESCE(p.new_parent_drive_id, d.drive_parent_id),
    last_seen_at = now()
  FROM document_payload p
  WHERE p.event_type = 'restored'
    AND p.review_required = false
    AND d.drive_item_id = p.drive_id
  RETURNING d.id
),
metadata_documents AS (
  UPDATE documents d
  SET
    file_name = COALESCE(p.new_name, d.file_name),
    drive_url = COALESCE(p.web_view_link, d.drive_url),
    drive_path = COALESCE(p.new_drive_path, d.drive_path),
    category_node_id = COALESCE(p.parent_category_node_id, d.category_node_id),
    drive_parent_id = COALESCE(p.new_parent_drive_id, d.drive_parent_id),
    drive_md5_checksum = COALESCE(p.md5_checksum, d.drive_md5_checksum),
    content_hash = COALESCE(p.content_hash, d.content_hash),
    content_hash_algorithm = COALESCE(CASE WHEN p.content_hash IS NOT NULL THEN 'drive_md5' ELSE NULL END, d.content_hash_algorithm),
    last_seen_at = now()
  FROM document_payload p
  WHERE p.event_type IN ('renamed', 'moved', 'metadata_changed')
    AND p.review_required = false
    AND d.drive_item_id = p.drive_id
  RETURNING d.id
),
renamed_category_nodes AS (
  UPDATE category_nodes c
  SET
    name = p.new_name,
    updated_at = now()
  FROM document_payload p
  WHERE p.event_type = 'renamed'
    AND p.item_type = 'folder'
    AND c.drive_folder_id = p.drive_id
    AND c.name IS DISTINCT FROM p.new_name
  RETURNING c.id
),
moved_category_nodes AS (
  UPDATE category_nodes c
  SET
    parent_id = p.parent_category_node_id,
    updated_at = now()
  FROM document_payload p
  WHERE p.event_type = 'moved'
    AND p.item_type = 'folder'
    AND c.drive_folder_id = p.drive_id
    AND p.parent_category_node_id IS DISTINCT FROM c.id
    AND c.parent_id IS DISTINCT FROM p.parent_category_node_id
  RETURNING c.id
),
logged_events AS (
  INSERT INTO drive_change_events (
    drive_id,
    change_id,
    event_type,
    item_type,
    old_parent_drive_id,
    new_parent_drive_id,
    old_drive_path,
    new_drive_path,
    old_name,
    new_name,
    content_hash,
    related_document_id,
    review_required,
    review_reason,
    processed_at,
    raw_change
  )
  SELECT
    d.drive_id,
    d.change_id,
    d.event_type,
    d.item_type,
    d.old_parent_drive_id,
    d.new_parent_drive_id,
    d.old_drive_path,
    d.new_drive_path,
    d.old_name,
    d.new_name,
    d.content_hash,
    COALESCE(created_documents.id, d.related_document_id),
    CASE
      WHEN d.event_type = 'created' AND d.item_type = 'file' THEN false
      ELSE d.review_required
    END,
    CASE
      WHEN d.event_type = 'created' AND d.item_type = 'file' THEN 'Documento creado en estado review_required para extraccion documental.'
      ELSE d.review_reason
    END,
    now(),
    d.raw_change
  FROM document_payload d
  LEFT JOIN created_documents ON created_documents.drive_item_id = d.drive_id
  RETURNING id, event_type
),
update_cursor AS (
  UPDATE drive_sync_state
  SET
    start_page_token = COALESCE((SELECT body->>'newStartPageToken' FROM payload), start_page_token),
    last_change_id = (
      SELECT change_id
      FROM parsed
      WHERE change_id IS NOT NULL
      ORDER BY change_time DESC NULLS LAST, change_id DESC
      LIMIT 1
    ),
    last_successful_sync_at = now(),
    last_error_at = NULL,
    last_error = NULL,
    updated_at = now()
  WHERE scope = 'documents_root'
  RETURNING scope, start_page_token, last_change_id, last_successful_sync_at
)
SELECT
  (SELECT count(*) FROM raw_changes) AS changes_seen,
  (SELECT count(*) FROM upsert_items) AS items_upserted,
  (SELECT count(*) FROM logged_events) AS events_logged,
  (SELECT count(*) FROM created_documents) AS documents_created_or_updated,
  (SELECT count(*) FROM trashed_documents) AS documents_trashed,
  (SELECT count(*) FROM out_of_scope_documents) AS documents_moved_out_of_scope,
  (SELECT count(*) FROM restored_documents) AS documents_restored,
  (SELECT count(*) FROM metadata_documents) AS documents_metadata_updated,
  (SELECT count(*) FROM renamed_category_nodes) AS categories_renamed,
  (SELECT count(*) FROM moved_category_nodes) AS categories_moved,
  update_cursor.scope,
  update_cursor.start_page_token,
  update_cursor.last_change_id,
  update_cursor.last_successful_sync_at
FROM update_cursor;`;

const emitFilesForExtractionSql = `WITH payload AS (
  SELECT $1::jsonb AS body
),
raw_changes AS (
  SELECT
    change_item.value AS raw_change,
    change_item.value->>'fileId' AS drive_id,
    NULLIF(change_item.value->>'changeId', '') AS change_id,
    COALESCE((change_item.value->>'removed')::boolean, false) AS removed,
    change_item.value->'file' AS file_metadata
  FROM payload
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(payload.body->'changes', '[]'::jsonb)) AS change_item(value)
),
parsed AS (
  SELECT
    r.raw_change,
    r.drive_id,
    r.change_id,
    COALESCE(r.file_metadata->>'name', '[removed]') AS name,
    COALESCE(r.file_metadata->>'mimeType', 'application/octet-stream') AS mime_type,
    NULLIF(r.file_metadata->'parents'->>0, '') AS parent_drive_id,
    COALESCE((r.file_metadata->>'trashed')::boolean, r.removed) AS trashed,
    NULLIF(r.file_metadata->>'modifiedTime', '') AS modified_time,
    NULLIF(r.file_metadata->>'md5Checksum', '') AS md5_checksum,
    NULLIF(r.file_metadata->>'webViewLink', '') AS web_view_link,
    NULLIF(r.file_metadata->>'size', '') AS size_bytes
  FROM raw_changes r
  WHERE r.drive_id IS NOT NULL
),
category_paths AS (
  WITH RECURSIVE tree AS (
    SELECT
      id,
      parent_id,
      name,
      ARRAY[name]::text[] AS path_parts
    FROM category_nodes
    WHERE parent_id IS NULL
    UNION ALL
    SELECT
      child.id,
      child.parent_id,
      child.name,
      tree.path_parts || child.name
    FROM category_nodes child
    JOIN tree ON tree.id = child.parent_id
  )
  SELECT id, path_parts
  FROM tree
),
created_events AS (
  SELECT DISTINCT ON (p.drive_id)
    p.*,
    item.category_node_id,
    COALESCE(parent_item.drive_path || '/' || p.name, item.drive_path, p.name) AS drive_path,
    COALESCE(category_paths.path_parts, ARRAY['Sin categoria']::text[]) AS category_path
  FROM parsed p
  JOIN drive_change_events event
    ON event.drive_id = p.drive_id
   AND event.event_type = 'created'
   AND event.review_required = false
   AND (event.change_id IS NOT DISTINCT FROM p.change_id)
  JOIN drive_items item ON item.drive_id = p.drive_id
  LEFT JOIN drive_items parent_item ON parent_item.drive_id = p.parent_drive_id
  LEFT JOIN category_paths ON category_paths.id = item.category_node_id
  WHERE p.mime_type <> 'application/vnd.google-apps.folder'
    AND p.trashed = false
  ORDER BY p.drive_id, event.processed_at DESC NULLS LAST, event.id DESC
)
SELECT
  drive_id AS id,
  drive_id AS drive_file_id,
  drive_id AS drive_item_id,
  web_view_link AS "webViewLink",
  name,
  mime_type AS "mimeType",
  modified_time AS "modifiedTime",
  md5_checksum AS "md5Checksum",
  size_bytes AS size,
  parent_drive_id,
  parent_drive_id AS drive_parent_id,
  drive_path,
  category_path,
  category_path[1] AS root_category,
  2026 AS processing_year,
  raw_change
FROM created_events;`;

const manualSaveDocumentSql = manualWorkflow.nodes.find(
  (node) => node.name === "Guardar documento",
)?.parameters?.query;

if (!manualSaveDocumentSql) {
  throw new Error("Manual Guardar documento SQL not found");
}

const saveExtractedDocumentSql = manualSaveDocumentSql
  .replace(
    "$25::text AS drive_md5_checksum\n)",
    "$25::text AS drive_md5_checksum,\n    $26::text AS drive_parent_id,\n    $27::text AS drive_item_id\n)",
  )
  .replace(
    "content_hash, content_hash_algorithm, drive_md5_checksum\n)",
    "content_hash, content_hash_algorithm, drive_md5_checksum, drive_parent_id, active, last_seen_at, drive_item_id\n)",
  )
  .replace(
    "i.extracted_data, i.processing_status, i.processing_error, i.content_hash, i.content_hash_algorithm, i.drive_md5_checksum\nFROM input i",
    "i.extracted_data, i.processing_status, i.processing_error, i.content_hash, i.content_hash_algorithm, i.drive_md5_checksum, i.drive_parent_id, true, now(), i.drive_item_id\nFROM input i",
  )
  .replace(
    "drive_md5_checksum = EXCLUDED.drive_md5_checksum\nRETURNING",
    "drive_md5_checksum = EXCLUDED.drive_md5_checksum,\n  drive_parent_id = EXCLUDED.drive_parent_id,\n  drive_item_id = EXCLUDED.drive_item_id,\n  active = true,\n  removed_at = NULL,\n  removed_reason = NULL,\n  review_reason = NULL,\n  last_seen_at = now()\nRETURNING",
  );

const markOcrVisionPendingCode = `function normalizeReasons(value) {
  return Array.isArray(value) ? value.map((reason) => String(reason || '').trim()).filter(Boolean) : [];
}

return items.map((item) => {
  const existingData = item.json.extracted_data || {};
  const reviewReasons = Array.from(new Set([
    ...normalizeReasons(existingData.review_reasons),
    'issuer_requires_ocr_or_vision',
    'ocr_or_vision_runtime_unavailable',
  ]));

  return {
    json: {
      ...item.json,
      extracted_data: {
        ...existingData,
        issuer_source: 'ocr_or_vision_pending',
        review_reasons: reviewReasons,
      },
      processing_status: 'review_required',
      processing_error: null,
    },
    binary: item.binary,
  };
});`;

const nodes = [
  {
    parameters: {
      httpMethod: "POST",
      path: "proyecto1-drive-incremental-sync",
      responseMode: "onReceived",
      responseCode: 202,
      responseData: "firstEntryJson",
      options: {},
    },
    id: "6074343d-6c2d-4070-9af0-e40e08df15001",
    name: "Webhook Next",
    type: "n8n-nodes-base.webhook",
    typeVersion: 2.1,
    webhookId: "proyecto1-drive-incremental-sync",
    position: [-980, 0],
  },
  {
    parameters: {
      jsCode:
        "const expected = String($env.N8N_DRIVE_INCREMENTAL_WEBHOOK_TOKEN || '').trim();\nif (!expected) {\n  throw new Error('missing_next_webhook_token_config');\n}\nconst headers = $json.headers || {};\nconst authHeader = String(headers.authorization || headers.Authorization || '').trim();\nconst receivedToken = authHeader.replace(/^Bearer\\s+/i, '').trim();\nif (receivedToken !== expected) {\n  throw new Error('invalid_next_webhook_token');\n}\nconst body = $json.body && typeof $json.body === 'object' ? $json.body : $json;\nconst scope = body.scope || 'documents_root';\nif (scope !== 'documents_root') {\n  throw new Error('invalid_drive_sync_scope');\n}\nreturn [{ json: { ...body, scope, received_at: new Date().toISOString() } }];",
    },
    id: "54e170ce-bb45-466e-994d-3565fe661001",
    name: "Validar token Next",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [-720, 0],
  },
  {
    parameters: {
      operation: "executeQuery",
      query: "SELECT scope, root_folder_id, start_page_token FROM drive_sync_state WHERE scope = 'documents_root';",
      options: {},
    },
    id: "f246cc53-448a-473c-b433-bb619852499e",
    name: "Leer estado Drive",
    type: "n8n-nodes-base.postgres",
    typeVersion: 2.6,
    position: [-460, 0],
    credentials: postgresCredentials,
  },
  {
    parameters: {
      conditions: {
        options: {
          caseSensitive: true,
          leftValue: "",
          typeValidation: "strict",
        },
        conditions: [
          {
            id: "has-token",
            leftValue: "={{ ($json.start_page_token || '').length }}",
            rightValue: 0,
            operator: {
              type: "number",
              operation: "gt",
            },
          },
        ],
        combinator: "and",
      },
      options: {},
    },
    id: "02f65451-83fc-4ca9-9819-4ab143790f6e",
    name: "Tiene cursor?",
    type: "n8n-nodes-base.if",
    typeVersion: 2.2,
    position: [-220, 0],
  },
  {
    parameters: {
      method: "GET",
      url: "=https://www.googleapis.com/drive/v3/changes/startPageToken",
      authentication: "predefinedCredentialType",
      nodeCredentialType: "googleDriveOAuth2Api",
      sendQuery: true,
      queryParameters: {
        parameters: [{ name: "supportsAllDrives", value: "true" }],
      },
      options: {},
    },
    id: "2356683b-426d-4700-b8ce-195a8066145c",
    name: "Obtener cursor inicial",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [60, 160],
    credentials: googleDriveCredentials,
  },
  {
    parameters: {
      operation: "executeQuery",
      query: "UPDATE drive_sync_state SET start_page_token = $1, last_successful_sync_at = now(), last_error_at = NULL, last_error = NULL, updated_at = now() WHERE scope = 'documents_root' RETURNING scope, start_page_token, last_successful_sync_at;",
      options: {
        queryReplacement: "={{ [$json.startPageToken] }}",
      },
    },
    id: "ff5836aa-12b0-4e28-8d8c-fdf1b5167b16",
    name: "Guardar cursor inicial",
    type: "n8n-nodes-base.postgres",
    typeVersion: 2.6,
    position: [340, 160],
    credentials: postgresCredentials,
  },
  {
    parameters: {
      method: "GET",
      url: "=https://www.googleapis.com/drive/v3/changes",
      authentication: "predefinedCredentialType",
      nodeCredentialType: "googleDriveOAuth2Api",
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: "pageToken", value: "={{ $json.start_page_token }}" },
          { name: "spaces", value: "drive" },
          { name: "pageSize", value: "1000" },
          { name: "supportsAllDrives", value: "true" },
          { name: "includeItemsFromAllDrives", value: "true" },
          {
            name: "fields",
            value:
              "newStartPageToken,nextPageToken,changes(fileId,removed,time,file(id,name,mimeType,modifiedTime,parents,trashed,webViewLink,md5Checksum,size))",
          },
        ],
      },
      options: {},
    },
    id: "a3a637c1-fce1-42f0-8faf-dc899052fe42",
    name: "Listar cambios Drive",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [60, -120],
    credentials: googleDriveCredentials,
  },
  {
    parameters: {
      operation: "executeQuery",
      query: syncSql,
      options: {
        queryReplacement:
          "={{ [JSON.stringify($json), $('Leer estado Drive').first().json.start_page_token] }}",
      },
    },
    id: "de039776-09d7-4ae5-b0cf-1ba0ab71403a",
    name: "Sincronizar cambios y documentos",
    type: "n8n-nodes-base.postgres",
    typeVersion: 2.6,
    position: [380, -120],
    credentials: postgresCredentials,
  },
  {
    parameters: {
      operation: "executeQuery",
      query: emitFilesForExtractionSql,
      options: {
        queryReplacement:
          "={{ [JSON.stringify($('Listar cambios Drive').first().json)] }}",
      },
    },
    id: "6c8078e6-5075-42a1-a67d-38229758e001",
    name: "Emitir archivos nuevos a extraer",
    type: "n8n-nodes-base.postgres",
    typeVersion: 2.6,
    position: [680, -120],
    credentials: postgresCredentials,
  },
  {
    parameters: {
      conditions: {
        options: {
          caseSensitive: true,
          leftValue: "",
          typeValidation: "strict",
        },
        conditions: [
          {
            id: "has-drive-file-id",
            leftValue: "={{ ($json.drive_file_id || '').length }}",
            rightValue: 0,
            operator: {
              type: "number",
              operation: "gt",
            },
          },
        ],
        combinator: "and",
      },
      options: {},
    },
    id: "f9f4ea14-4484-4eee-84a5-b401d633e001",
    name: "Hay archivos nuevos?",
    type: "n8n-nodes-base.if",
    typeVersion: 2.2,
    position: [820, -120],
  },
  cloneManualNode("Descargar archivo", {
    id: "5c3269a8-2ff2-4271-a47a-b9b6de40e001",
    name: "Descargar archivo nuevo",
    position: [1080, -120],
  }),
  cloneManualNode("Calcular SHA256", {
    id: "724e77df-f961-4a7b-b08a-4b2919b8e001",
    position: [1340, -120],
  }),
  cloneManualNode("Preparar metadata con hash", {
    id: "aa065876-b029-4f07-99d3-f29e6a20e001",
    parameters: {
      jsCode: replaceAllText(
        manualWorkflow.nodes.find((node) => node.name === "Preparar metadata con hash")
          .parameters.jsCode,
        [["Decidir procesamiento", "Emitir archivos nuevos a extraer"]],
      ),
    },
    position: [1600, -120],
  }),
  cloneManualNode("Es PDF?", {
    id: "4045f265-6f05-48f4-9071-a583795de001",
    position: [1860, -120],
  }),
  cloneManualNode("Extraer texto PDF", {
    id: "5f50f655-5b36-4766-bf66-32236df9e001",
    position: [2120, -220],
  }),
  cloneManualNode("Normalizar extracción PDF", {
    id: "5e2454e8-e60b-4e72-b7fe-44704029e001",
    parameters: {
      jsCode: replaceAllText(
        manualWorkflow.nodes.find((node) => node.name === "Normalizar extracción PDF")
          .parameters.jsCode,
        [
          ["Descargar archivo", "Descargar archivo nuevo"],
          [
            "const source = $('Descargar archivo nuevo').all()[pairedIndex]?.json || item.json;",
            "const sourceIndex = Number.isInteger(pairedIndex) ? pairedIndex : index;\n  const downloadedSource = $('Descargar archivo nuevo').all()[sourceIndex]?.json || {};\n  const preparedSource = $('Preparar metadata con hash').all()[sourceIndex]?.json || {};\n  const source = { ...downloadedSource, ...preparedSource, ...item.json };",
          ],
        ],
      ),
    },
    position: [2380, -220],
  }),
  cloneManualNode("Marcar requiere OCR", {
    id: "5fa62403-d30e-482a-b59d-1625a955e001",
    position: [2120, 20],
  }),
  cloneManualNode("Necesita OCR/Vision issuer?", {
    id: "9d7f6360-a715-489b-aaec-42e7da3de001",
    position: [2640, -220],
  }),
  cloneManualNode("Inferir entidad pagadora OCR/Vision", {
    id: "e1cc6744-c983-4244-8d85-784f9f77e001",
    parameters: {
      jsCode: markOcrVisionPendingCode,
    },
    position: [2900, -120],
  }),
  cloneManualNode("Guardar documento", {
    id: "a658d92b-a405-4e78-acba-2d328d0de001",
    name: "Guardar documento extraido",
    parameters: {
      operation: "executeQuery",
      query: saveExtractedDocumentSql,
      options: {
        queryReplacement: "={{ [\n  $json.id || $json.drive_file_id,\n  $json.webViewLink || null,\n  $json.name,\n  JSON.stringify($json.category_path || []),\n  $json.drive_path,\n  $json.fiscal_period_year || $json.processing_year || 2026,\n  $json.fiscal_period_month || null,\n  $json.fiscal_period_kind || 'year',\n  $json.payment_date || null,\n  $json.payment_time || null,\n  $json.amount || null,\n  $json.currency || null,\n  $json.reason || null,\n  $json.reference || null,\n  $json.issuer || null,\n  $json.payee || null,\n  $json.user_note || null,\n  $json.raw_text || null,\n  JSON.stringify($json.extracted_data || {}),\n  $json.processing_status || 'review_required',\n  $json.processing_error || null,\n  $json.covered_fiscal_months || null,\n  $json.content_hash || null,\n  $json.content_hash_algorithm || null,\n  $json.drive_md5_checksum || $json.md5Checksum || null,\n  $json.drive_parent_id || $json.parent_drive_id || null,\n  $json.original_drive_file_id || $json.drive_item_id || $json.drive_file_id || $json.id || null\n] }}",
      },
    },
    position: [3180, -120],
  }),
];

const connections = {
  "Webhook Next": {
    main: [[{ node: "Validar token Next", type: "main", index: 0 }]],
  },
  "Validar token Next": {
    main: [[{ node: "Leer estado Drive", type: "main", index: 0 }]],
  },
  "Leer estado Drive": {
    main: [[{ node: "Tiene cursor?", type: "main", index: 0 }]],
  },
  "Tiene cursor?": {
    main: [
      [{ node: "Listar cambios Drive", type: "main", index: 0 }],
      [{ node: "Obtener cursor inicial", type: "main", index: 0 }],
    ],
  },
  "Obtener cursor inicial": {
    main: [[{ node: "Guardar cursor inicial", type: "main", index: 0 }]],
  },
  "Listar cambios Drive": {
    main: [[{ node: "Sincronizar cambios y documentos", type: "main", index: 0 }]],
  },
  "Sincronizar cambios y documentos": {
    main: [[{ node: "Emitir archivos nuevos a extraer", type: "main", index: 0 }]],
  },
  "Emitir archivos nuevos a extraer": {
    main: [[{ node: "Hay archivos nuevos?", type: "main", index: 0 }]],
  },
  "Hay archivos nuevos?": {
    main: [[{ node: "Descargar archivo nuevo", type: "main", index: 0 }], []],
  },
  "Descargar archivo nuevo": {
    main: [[{ node: "Calcular SHA256", type: "main", index: 0 }]],
  },
  "Calcular SHA256": {
    main: [[{ node: "Preparar metadata con hash", type: "main", index: 0 }]],
  },
  "Preparar metadata con hash": {
    main: [[{ node: "Es PDF?", type: "main", index: 0 }]],
  },
  "Es PDF?": {
    main: [
      [{ node: "Extraer texto PDF", type: "main", index: 0 }],
      [{ node: "Marcar requiere OCR", type: "main", index: 0 }],
    ],
  },
  "Extraer texto PDF": {
    main: [[{ node: "Normalizar extracción PDF", type: "main", index: 0 }]],
  },
  "Normalizar extracción PDF": {
    main: [[{ node: "Necesita OCR/Vision issuer?", type: "main", index: 0 }]],
  },
  "Marcar requiere OCR": {
    main: [[{ node: "Inferir entidad pagadora OCR/Vision", type: "main", index: 0 }]],
  },
  "Necesita OCR/Vision issuer?": {
    main: [
      [{ node: "Inferir entidad pagadora OCR/Vision", type: "main", index: 0 }],
      [{ node: "Guardar documento extraido", type: "main", index: 0 }],
    ],
  },
  "Inferir entidad pagadora OCR/Vision": {
    main: [[{ node: "Guardar documento extraido", type: "main", index: 0 }]],
  },
};

const workflow = {
  id: workflowId,
  name: workflowName,
  active: false,
  nodes,
  connections,
  settings: { executionOrder: "v1" },
  staticData: null,
  pinData: {},
  versionId: "4e4b79e2-6045-47f4-a70e-e08bc46d0001",
  triggerCount: 0,
  meta: {
    templateCredsSetupCompleted: true,
    stage: "drive-incremental-sync",
  },
  parentFolderId: null,
  isArchived: false,
  versionCounter: 1,
  description:
    "Workflow unico incremental: lee cambios de Drive y aplica directamente alta, duplicado, baja, restauracion o metadata en documents, registrando auditoria.",
};

mkdirSync("docs/n8n", { recursive: true });
writeFileSync(
  "docs/n8n/2026-09-06-drive-incremental-sync-workflow.json",
  `${JSON.stringify([workflow], null, 2)}\n`,
);
writeFileSync(
  "/tmp/proyecto1_drive_incremental_sync_workflow.b64",
  Buffer.from(JSON.stringify(workflow)).toString("base64"),
);

console.log(`Wrote ${workflow.id} to docs/n8n/2026-09-06-drive-incremental-sync-workflow.json`);
