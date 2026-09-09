alter table drive_sync_state
  add column if not exists watch_channel_id text,
  add column if not exists watch_resource_id text,
  add column if not exists watch_expiration_at timestamptz,
  add column if not exists watch_token text,
  add column if not exists webhook_url text,
  add column if not exists last_webhook_at timestamptz,
  add column if not exists last_webhook_message_number bigint;

create table if not exists drive_webhook_notifications (
  id bigint generated always as identity primary key,
  scope text not null references drive_sync_state(scope),
  channel_id text not null,
  channel_token_present boolean not null default false,
  resource_id text not null,
  resource_uri text,
  resource_state text not null,
  message_number bigint not null,
  changed text[] not null default '{}'::text[],
  channel_expiration text,
  received_at timestamptz not null default now(),
  forwarded_at timestamptz,
  forward_status integer,
  forward_error text,
  raw_headers jsonb not null default '{}'::jsonb
);

create index if not exists idx_drive_webhook_notifications_scope_received
  on drive_webhook_notifications (scope, received_at desc);

create index if not exists idx_drive_webhook_notifications_channel_message
  on drive_webhook_notifications (channel_id, message_number);
