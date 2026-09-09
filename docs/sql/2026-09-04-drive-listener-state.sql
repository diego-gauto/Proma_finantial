alter table documents
  add column if not exists drive_item_id text;

update documents
set drive_item_id = regexp_replace(drive_file_id, '#.*$', '')
where drive_item_id is null
  and drive_file_id is not null;

create table if not exists drive_items (
  drive_id text primary key,
  name text not null,
  mime_type text not null,
  item_type text not null,
  parent_drive_id text,
  drive_path text not null,
  within_root boolean not null default true,
  trashed boolean not null default false,
  modified_time timestamptz,
  md5_checksum text,
  content_hash text,
  content_hash_algorithm text,
  web_view_link text,
  size_bytes bigint,
  category_node_id bigint references category_nodes(id),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_event_type text,
  raw_metadata jsonb not null default '{}'::jsonb
);

create table if not exists drive_change_events (
  id bigint generated always as identity primary key,
  drive_id text not null,
  change_id text,
  event_type text not null,
  item_type text,
  old_parent_drive_id text,
  new_parent_drive_id text,
  old_drive_path text,
  new_drive_path text,
  old_name text,
  new_name text,
  content_hash text,
  related_document_id bigint references documents(id),
  review_required boolean not null default false,
  review_reason text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  raw_change jsonb not null default '{}'::jsonb
);

create table if not exists drive_sync_state (
  scope text primary key,
  root_folder_id text not null,
  start_page_token text,
  last_change_id text,
  last_successful_sync_at timestamptz,
  last_error_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

insert into drive_items (
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
  first_seen_at,
  last_seen_at,
  last_event_type,
  raw_metadata
)
select distinct on (drive_item_id)
  drive_item_id,
  file_name,
  coalesce(nullif(extracted_data->>'mime_type', ''), 'application/octet-stream'),
  'file',
  drive_parent_id,
  drive_path,
  active,
  false,
  nullif(extracted_data->>'file_modified_at', '')::timestamptz,
  drive_md5_checksum,
  content_hash,
  content_hash_algorithm,
  drive_url,
  nullif(extracted_data->>'size', '')::bigint,
  category_node_id,
  created_at,
  coalesce(last_seen_at, updated_at),
  'initial_backfill',
  jsonb_strip_nulls(jsonb_build_object(
    'source', 'documents_backfill',
    'document_id', id,
    'drive_file_id', drive_file_id,
    'logical_drive_file_id', drive_file_id,
    'original_drive_file_id', nullif(extracted_data->>'original_drive_file_id', ''),
    'category_path', extracted_data->'category_path'
  ))
from documents
where drive_item_id is not null
order by drive_item_id, updated_at desc, id desc
on conflict (drive_id) do update set
  name = excluded.name,
  mime_type = excluded.mime_type,
  item_type = excluded.item_type,
  parent_drive_id = excluded.parent_drive_id,
  drive_path = excluded.drive_path,
  within_root = excluded.within_root,
  trashed = excluded.trashed,
  modified_time = excluded.modified_time,
  md5_checksum = excluded.md5_checksum,
  content_hash = excluded.content_hash,
  content_hash_algorithm = excluded.content_hash_algorithm,
  web_view_link = excluded.web_view_link,
  size_bytes = excluded.size_bytes,
  category_node_id = excluded.category_node_id,
  last_seen_at = excluded.last_seen_at,
  last_event_type = excluded.last_event_type,
  raw_metadata = drive_items.raw_metadata || excluded.raw_metadata;

insert into drive_sync_state (scope, root_folder_id)
values ('documents_root', '1e7vaYaveNP85KyH0wpV6d_MELr60OREg')
on conflict (scope) do update set
  root_folder_id = excluded.root_folder_id,
  updated_at = now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'documents_drive_item_id_fkey'
      and conrelid = 'documents'::regclass
  ) then
    alter table documents
      add constraint documents_drive_item_id_fkey
      foreign key (drive_item_id) references drive_items(drive_id);
  end if;
end $$;

alter table drive_items
  drop constraint if exists drive_items_item_type_check,
  add constraint drive_items_item_type_check
    check (item_type in ('file', 'folder'));

alter table drive_items
  drop constraint if exists drive_items_content_hash_algorithm_check,
  add constraint drive_items_content_hash_algorithm_check
    check (
      content_hash_algorithm is null
      or content_hash_algorithm in ('sha256', 'drive_md5')
    );

alter table drive_change_events
  drop constraint if exists drive_change_events_event_type_check,
  add constraint drive_change_events_event_type_check
    check (
      event_type in (
        'created',
        'renamed',
        'moved',
        'trashed',
        'restored',
        'removed_from_scope',
        'duplicate_candidate',
        'metadata_changed',
        'reconciled'
      )
    );

create index if not exists idx_documents_drive_item_id
  on documents (drive_item_id)
  where drive_item_id is not null;

create index if not exists idx_drive_items_parent
  on drive_items (parent_drive_id)
  where parent_drive_id is not null;

create index if not exists idx_drive_items_content_hash
  on drive_items (content_hash)
  where content_hash is not null;

create index if not exists idx_drive_items_category_node
  on drive_items (category_node_id)
  where category_node_id is not null;

create index if not exists idx_drive_change_events_drive_id
  on drive_change_events (drive_id);

create index if not exists idx_drive_change_events_review
  on drive_change_events (review_required, processed_at)
  where review_required;
