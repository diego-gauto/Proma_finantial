alter table documents
  add column if not exists content_hash text,
  add column if not exists content_hash_algorithm text,
  add column if not exists drive_md5_checksum text,
  add column if not exists drive_parent_id text,
  add column if not exists active boolean not null default true,
  add column if not exists removed_at timestamptz,
  add column if not exists removed_reason text,
  add column if not exists duplicate_of_document_id bigint,
  add column if not exists review_reason text,
  add column if not exists last_seen_at timestamptz;

alter table category_nodes
  add column if not exists drive_folder_id text;

update documents
set drive_md5_checksum = nullif(extracted_data->>'md5Checksum', '')
where drive_md5_checksum is null
  and nullif(extracted_data->>'md5Checksum', '') is not null;

update documents
set content_hash = nullif(extracted_data->>'sha256', ''),
    content_hash_algorithm = 'sha256'
where content_hash is null
  and nullif(extracted_data->>'sha256', '') is not null;

update documents
set content_hash = drive_md5_checksum,
    content_hash_algorithm = 'drive_md5'
where content_hash is null
  and drive_md5_checksum is not null;

update documents
set last_seen_at = coalesce(
  nullif(extracted_data->>'last_seen_at', '')::timestamptz,
  nullif(extracted_data->>'file_modified_at', '')::timestamptz,
  updated_at
)
where last_seen_at is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'documents_duplicate_of_document_id_fkey'
      and conrelid = 'documents'::regclass
  ) then
    alter table documents
      add constraint documents_duplicate_of_document_id_fkey
      foreign key (duplicate_of_document_id) references documents(id);
  end if;
end $$;

alter table documents
  drop constraint if exists documents_content_hash_algorithm_check,
  add constraint documents_content_hash_algorithm_check
    check (
      content_hash_algorithm is null
      or content_hash_algorithm in ('sha256', 'drive_md5')
    );

alter table documents
  drop constraint if exists documents_removed_reason_check,
  add constraint documents_removed_reason_check
    check (
      removed_reason is null
      or removed_reason in (
        'trashed',
        'moved_out_of_scope',
        'duplicate_discarded',
        'manual'
      )
    );

alter table documents
  drop constraint if exists documents_removed_state_check,
  add constraint documents_removed_state_check
    check (
      active = true
      or removed_at is not null
      or removed_reason is not null
    );

create index if not exists idx_documents_content_hash
  on documents (content_hash)
  where content_hash is not null;

create index if not exists idx_documents_drive_md5_checksum
  on documents (drive_md5_checksum)
  where drive_md5_checksum is not null;

create index if not exists idx_documents_drive_parent_id
  on documents (drive_parent_id)
  where drive_parent_id is not null;

create index if not exists idx_documents_active
  on documents (active);

create index if not exists idx_documents_duplicate_of_document_id
  on documents (duplicate_of_document_id)
  where duplicate_of_document_id is not null;

create unique index if not exists ux_category_nodes_drive_folder_id
  on category_nodes (drive_folder_id)
  where drive_folder_id is not null;
