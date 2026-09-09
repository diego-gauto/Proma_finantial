import { mkdirSync, writeFileSync } from "node:fs";

const workflowId = "proyecto1DriveFolderCategoryBackfill";
const workflowName = "Proyecto 1 - Backfill carpetas Drive categorias";

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

const saveFoldersSql = `WITH input_rows AS (
  SELECT *
  FROM jsonb_to_recordset($1::jsonb) AS row_data(
    drive_id text,
    name text,
    mime_type text,
    parent_drive_id text,
    drive_path text,
    category_path text[],
    is_category_folder boolean,
    modified_time timestamptz,
    web_view_link text
  )
),
category_tree AS (
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
matched AS (
  SELECT
    input_rows.*,
    category_tree.id AS category_node_id
  FROM input_rows
  LEFT JOIN category_tree
    ON category_tree.path_parts = input_rows.category_path
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
    category_node_id,
    web_view_link,
    last_seen_at,
    last_event_type,
    raw_metadata
  )
  SELECT
    drive_id,
    name,
    mime_type,
    'folder',
    parent_drive_id,
    drive_path,
    true,
    false,
    modified_time,
    category_node_id,
    web_view_link,
    now(),
    'folder_category_backfill',
    jsonb_strip_nulls(jsonb_build_object(
      'source', 'folder_category_backfill',
      'category_path', category_path,
      'is_category_folder', is_category_folder
    ))
  FROM matched
  ON CONFLICT (drive_id) DO UPDATE SET
    name = EXCLUDED.name,
    mime_type = EXCLUDED.mime_type,
    item_type = EXCLUDED.item_type,
    parent_drive_id = EXCLUDED.parent_drive_id,
    drive_path = EXCLUDED.drive_path,
    within_root = true,
    trashed = false,
    modified_time = EXCLUDED.modified_time,
    category_node_id = COALESCE(EXCLUDED.category_node_id, drive_items.category_node_id),
    web_view_link = EXCLUDED.web_view_link,
    last_seen_at = now(),
    last_event_type = EXCLUDED.last_event_type,
    raw_metadata = drive_items.raw_metadata || EXCLUDED.raw_metadata
  RETURNING drive_id
),
mapped_categories AS (
  UPDATE category_nodes category
  SET drive_folder_id = matched.drive_id
  FROM matched
  WHERE matched.category_node_id = category.id
    AND matched.is_category_folder = true
    AND (
      category.drive_folder_id IS NULL
      OR category.drive_folder_id = matched.drive_id
    )
  RETURNING category.id
)
SELECT
  (SELECT count(*) FROM input_rows) AS folders_seen,
  (SELECT count(*) FROM upsert_items) AS folders_upserted,
  (SELECT count(*) FROM mapped_categories) AS categories_mapped;`;

const nodes = [
  {
    parameters: {},
    id: "c77bc4b0-f6f1-4716-98c0-bd656a93e201",
    name: "Manual Trigger",
    type: "n8n-nodes-base.manualTrigger",
    typeVersion: 1,
    position: [-1120, 0],
  },
  {
    parameters: {
      assignments: {
        assignments: [
          {
            id: "root",
            name: "ROOT_FOLDER_ID",
            value: "1e7vaYaveNP85KyH0wpV6d_MELr60OREg",
            type: "string",
          },
        ],
      },
      options: {},
    },
    id: "90456b9c-9a80-407e-bce4-c35f96e4a6f7",
    name: "Config",
    type: "n8n-nodes-base.set",
    typeVersion: 3.4,
    position: [-900, 0],
  },
  {
    parameters: {
      jsCode:
        "return [{ json: { ROOT_FOLDER_ID: $json.ROOT_FOLDER_ID, folderQueue: [{ id: $json.ROOT_FOLDER_ID, name: 'ROOT', drive_path: '', category_path: [] }], processedFolders: 0 } }];",
    },
    id: "192d187c-7302-4260-9cc9-ee797500ad01",
    name: "Inicializar carpetas",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [-680, 0],
  },
  {
    parameters: {
      jsCode:
        "const queue = [...($json.folderQueue || [])];\nconst current = queue.shift();\nif (!current) return [{ json: { ...$json, currentFolderId: null, currentFolder: null, folderQueue: queue } }];\nreturn [{ json: { ...$json, currentFolderId: current.id, currentFolder: current, folderQueue: queue } }];",
    },
    id: "114cae9d-604f-40c8-93bd-7642889bfdbb",
    name: "Preparar carpeta",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [-460, 0],
  },
  {
    parameters: {
      method: "GET",
      url: "=https://www.googleapis.com/drive/v3/files",
      authentication: "predefinedCredentialType",
      nodeCredentialType: "googleDriveOAuth2Api",
      sendQuery: true,
      queryParameters: {
        parameters: [
          {
            name: "q",
            value:
              "={{ '\"' + $json.currentFolderId + '\" in parents and trashed = false and mimeType = \"application/vnd.google-apps.folder\"' }}",
          },
          {
            name: "fields",
            value: "files(id,name,mimeType,modifiedTime,parents,webViewLink)",
          },
          { name: "pageSize", value: "1000" },
          { name: "supportsAllDrives", value: "true" },
          { name: "includeItemsFromAllDrives", value: "true" },
        ],
      },
      options: {},
    },
    id: "8a753a49-525d-49e0-a86d-df0722b833e2",
    name: "Listar subcarpetas",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [-240, 0],
    credentials: googleDriveCredentials,
  },
  {
    parameters: {
      jsCode:
        "function isYearFolder(name) {\n  return /^(19|20)\\d{2}$/.test(String(name || '').trim());\n}\n\nconst current = $('Preparar carpeta').first().json;\nconst parent = current.currentFolder || { drive_path: '', category_path: [] };\nconst folders = Array.isArray($json.files) ? $json.files : [];\nconst folderRows = folders.map((folder) => {\n  const name = String(folder.name || '').trim();\n  const isCategoryFolder = !isYearFolder(name);\n  const categoryPath = isCategoryFolder ? [...(parent.category_path || []), name] : [...(parent.category_path || [])];\n  const drivePath = [parent.drive_path, name].filter(Boolean).join('/');\n  return {\n    drive_id: folder.id,\n    name,\n    mime_type: folder.mimeType || 'application/vnd.google-apps.folder',\n    parent_drive_id: current.currentFolderId,\n    drive_path: drivePath,\n    category_path: categoryPath,\n    is_category_folder: isCategoryFolder,\n    modified_time: folder.modifiedTime || null,\n    web_view_link: folder.webViewLink || null,\n  };\n});\nconst childQueue = folderRows.map((row) => ({\n  id: row.drive_id,\n  name: row.name,\n  drive_path: row.drive_path,\n  category_path: row.category_path,\n}));\nreturn [{ json: { ...current, folderRows, childQueue } }];",
    },
    id: "8328dc34-4697-4359-a606-211804273eee",
    name: "Preparar filas de carpetas",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [-20, 0],
  },
  {
    parameters: {
      operation: "executeQuery",
      query: saveFoldersSql,
      options: {
        queryReplacement: "={{ [JSON.stringify($json.folderRows || [])] }}",
      },
    },
    id: "8811f8b1-7068-4747-84ca-9023e6cc71b9",
    name: "Guardar carpetas y mapear categorias",
    type: "n8n-nodes-base.postgres",
    typeVersion: 2.6,
    position: [220, 0],
    credentials: postgresCredentials,
  },
  {
    parameters: {
      jsCode:
        "const prepared = $('Preparar filas de carpetas').first().json;\nreturn [{ json: { ...prepared, folderQueue: [...(prepared.folderQueue || []), ...(prepared.childQueue || [])], processedFolders: (prepared.processedFolders || 0) + 1 } }];",
    },
    id: "98332579-d351-45ec-a416-55fe94617ead",
    name: "Acumular subcarpetas",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [460, 0],
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
            id: "has-folders",
            leftValue: "={{ $json.folderQueue.length }}",
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
    id: "9a2d3078-8155-4490-894f-78a1ee9747af",
    name: "Quedan carpetas?",
    type: "n8n-nodes-base.if",
    typeVersion: 2.2,
    position: [700, 0],
  },
];

const connections = {
  "Manual Trigger": {
    main: [[{ node: "Config", type: "main", index: 0 }]],
  },
  Config: {
    main: [[{ node: "Inicializar carpetas", type: "main", index: 0 }]],
  },
  "Inicializar carpetas": {
    main: [[{ node: "Preparar carpeta", type: "main", index: 0 }]],
  },
  "Preparar carpeta": {
    main: [[{ node: "Listar subcarpetas", type: "main", index: 0 }]],
  },
  "Listar subcarpetas": {
    main: [[{ node: "Preparar filas de carpetas", type: "main", index: 0 }]],
  },
  "Preparar filas de carpetas": {
    main: [[{ node: "Guardar carpetas y mapear categorias", type: "main", index: 0 }]],
  },
  "Guardar carpetas y mapear categorias": {
    main: [[{ node: "Acumular subcarpetas", type: "main", index: 0 }]],
  },
  "Acumular subcarpetas": {
    main: [[{ node: "Quedan carpetas?", type: "main", index: 0 }]],
  },
  "Quedan carpetas?": {
    main: [[{ node: "Preparar carpeta", type: "main", index: 0 }], []],
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
  versionId: "68972f2b-3a13-4d37-86ea-95f015870001",
  triggerCount: 0,
  meta: {
    templateCredsSetupCompleted: true,
    stage: "drive-folder-category-backfill",
  },
  parentFolderId: null,
  isArchived: false,
  versionCounter: 1,
  description:
    "Workflow manual de preparacion: recorre carpetas Drive, guarda drive_items folder y completa category_nodes.drive_folder_id solo para categorias existentes.",
};

mkdirSync("docs/n8n", { recursive: true });
writeFileSync(
  "docs/n8n/2026-09-06-drive-folder-category-backfill-workflow.json",
  `${JSON.stringify([workflow], null, 2)}\n`,
);
writeFileSync(
  "/tmp/proyecto1_drive_folder_category_backfill_workflow.b64",
  Buffer.from(JSON.stringify(workflow)).toString("base64"),
);

console.log(`Wrote ${workflow.id} to docs/n8n/2026-09-06-drive-folder-category-backfill-workflow.json`);
