import { getDbPool } from "@/db/client";

import type { DriveWebhookNotification } from "./drive-webhook";

export type DriveWebhookState = {
  scope: string;
  rootFolderId: string;
  watchChannelId: string | null;
  watchResourceId: string | null;
  watchToken: string | null;
};

type DriveWebhookStateRow = {
  scope: string;
  root_folder_id: string;
  watch_channel_id: string | null;
  watch_resource_id: string | null;
  watch_token: string | null;
};

type InsertedNotificationRow = {
  id: string;
};

export async function getDriveWebhookState(
  scope: string
): Promise<DriveWebhookState | null> {
  const result = await getDbPool().query<DriveWebhookStateRow>(
    `
      select
        scope,
        root_folder_id,
        watch_channel_id,
        watch_resource_id,
        watch_token
      from drive_sync_state
      where scope = $1
    `,
    [scope]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    scope: row.scope,
    rootFolderId: row.root_folder_id,
    watchChannelId: row.watch_channel_id,
    watchResourceId: row.watch_resource_id,
    watchToken: row.watch_token
  };
}

export async function recordDriveWebhookNotification(input: {
  scope: string;
  notification: DriveWebhookNotification;
  rawHeaders: Record<string, string>;
}): Promise<number> {
  const result = await getDbPool().query<InsertedNotificationRow>(
    `
      insert into drive_webhook_notifications (
        scope,
        channel_id,
        channel_token_present,
        resource_id,
        resource_uri,
        resource_state,
        message_number,
        changed,
        channel_expiration,
        raw_headers
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9, $10::jsonb)
      returning id
    `,
    [
      input.scope,
      input.notification.channelId,
      Boolean(input.notification.channelToken),
      input.notification.resourceId,
      input.notification.resourceUri,
      input.notification.resourceState,
      input.notification.messageNumber,
      input.notification.changed,
      input.notification.channelExpiration,
      JSON.stringify(input.rawHeaders)
    ]
  );

  await getDbPool().query(
    `
      update drive_sync_state
      set
        last_webhook_at = now(),
        last_webhook_message_number = $2,
        updated_at = now()
      where scope = $1
    `,
    [input.scope, input.notification.messageNumber]
  );

  return Number(result.rows[0].id);
}

export async function markDriveWebhookForwardResult(input: {
  notificationId: number;
  status: number | null;
  error: string | null;
}): Promise<void> {
  await getDbPool().query(
    `
      update drive_webhook_notifications
      set
        forwarded_at = now(),
        forward_status = $2,
        forward_error = $3
      where id = $1
    `,
    [input.notificationId, input.status, input.error]
  );
}
