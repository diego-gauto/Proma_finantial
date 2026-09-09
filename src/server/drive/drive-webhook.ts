export type DriveWebhookNotification = {
  channelId: string | null;
  channelToken: string | null;
  resourceId: string | null;
  resourceUri: string | null;
  resourceState: string | null;
  messageNumber: number | null;
  changed: string[];
  channelExpiration: string | null;
};

export type DriveWebhookValidationConfig = {
  expectedChannelId: string | null;
  expectedToken: string | null;
  expectedResourceId: string | null;
};

export type DriveWebhookValidationResult =
  | { ok: true }
  | { ok: false; status: 400 | 403; reason: string };

function readHeader(headers: Headers, name: string): string | null {
  const value = headers.get(name);
  return value && value.trim() !== "" ? value.trim() : null;
}

function parseChanged(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseMessageNumber(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseDriveWebhookHeaders(headers: Headers): DriveWebhookNotification {
  return {
    channelId: readHeader(headers, "x-goog-channel-id"),
    channelToken: readHeader(headers, "x-goog-channel-token"),
    resourceId: readHeader(headers, "x-goog-resource-id"),
    resourceUri: readHeader(headers, "x-goog-resource-uri"),
    resourceState: readHeader(headers, "x-goog-resource-state"),
    messageNumber: parseMessageNumber(readHeader(headers, "x-goog-message-number")),
    changed: parseChanged(readHeader(headers, "x-goog-changed")),
    channelExpiration: readHeader(headers, "x-goog-channel-expiration")
  };
}

export function validateDriveWebhookNotification(
  notification: DriveWebhookNotification,
  config: DriveWebhookValidationConfig
): DriveWebhookValidationResult {
  if (!notification.channelId) {
    return { ok: false, status: 400, reason: "missing_channel_id" };
  }

  if (!notification.resourceId) {
    return { ok: false, status: 400, reason: "missing_resource_id" };
  }

  if (!notification.resourceState) {
    return { ok: false, status: 400, reason: "missing_resource_state" };
  }

  if (!notification.messageNumber) {
    return { ok: false, status: 400, reason: "missing_message_number" };
  }

  if (
    config.expectedChannelId &&
    notification.channelId !== config.expectedChannelId
  ) {
    return { ok: false, status: 403, reason: "invalid_channel_id" };
  }

  if (config.expectedToken && notification.channelToken !== config.expectedToken) {
    return { ok: false, status: 403, reason: "invalid_channel_token" };
  }

  if (
    config.expectedResourceId &&
    notification.resourceId !== config.expectedResourceId
  ) {
    return { ok: false, status: 403, reason: "invalid_resource_id" };
  }

  return { ok: true };
}

export function buildDriveWebhookPayload(input: {
  scope: string;
  notificationId: number;
  notification: DriveWebhookNotification;
}) {
  return {
    scope: input.scope,
    notificationId: input.notificationId,
    source: "google_drive_push",
    channelId: input.notification.channelId,
    resourceId: input.notification.resourceId,
    resourceState: input.notification.resourceState,
    messageNumber: input.notification.messageNumber,
    changed: input.notification.changed
  };
}
