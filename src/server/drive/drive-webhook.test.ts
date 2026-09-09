import { describe, expect, it } from "vitest";

import {
  buildDriveWebhookPayload,
  parseDriveWebhookHeaders,
  validateDriveWebhookNotification
} from "./drive-webhook";

describe("parseDriveWebhookHeaders", () => {
  it("normalizes Google Drive push headers", () => {
    const notification = parseDriveWebhookHeaders(
      new Headers({
        "X-Goog-Channel-ID": "channel-123",
        "X-Goog-Channel-Token": "scope=documents_root&secret=test-token",
        "X-Goog-Resource-ID": "resource-123",
        "X-Goog-Resource-URI": "https://www.googleapis.com/drive/v3/changes",
        "X-Goog-Resource-State": "change",
        "X-Goog-Message-Number": "42",
        "X-Goog-Changed": "parents, properties",
        "X-Goog-Channel-Expiration": "Tue, 19 Nov 2030 01:13:52 GMT"
      })
    );

    expect(notification).toEqual({
      channelId: "channel-123",
      channelToken: "scope=documents_root&secret=test-token",
      resourceId: "resource-123",
      resourceUri: "https://www.googleapis.com/drive/v3/changes",
      resourceState: "change",
      messageNumber: 42,
      changed: ["parents", "properties"],
      channelExpiration: "Tue, 19 Nov 2030 01:13:52 GMT"
    });
  });
});

describe("validateDriveWebhookNotification", () => {
  it("accepts a notification that matches the registered channel and token", () => {
    const result = validateDriveWebhookNotification(
      {
        channelId: "channel-123",
        channelToken: "token-123",
        resourceId: "resource-123",
        resourceUri: "https://www.googleapis.com/drive/v3/changes",
        resourceState: "change",
        messageNumber: 2,
        changed: [],
        channelExpiration: null
      },
      {
        expectedChannelId: "channel-123",
        expectedToken: "token-123",
        expectedResourceId: "resource-123"
      }
    );

    expect(result).toEqual({ ok: true });
  });

  it("rejects a notification with a wrong channel token", () => {
    const result = validateDriveWebhookNotification(
      {
        channelId: "channel-123",
        channelToken: "wrong",
        resourceId: "resource-123",
        resourceUri: "https://www.googleapis.com/drive/v3/changes",
        resourceState: "change",
        messageNumber: 2,
        changed: [],
        channelExpiration: null
      },
      {
        expectedChannelId: "channel-123",
        expectedToken: "token-123",
        expectedResourceId: "resource-123"
      }
    );

    expect(result).toEqual({
      ok: false,
      status: 403,
      reason: "invalid_channel_token"
    });
  });

  it("rejects missing required Google headers", () => {
    const result = validateDriveWebhookNotification(
      {
        channelId: null,
        channelToken: null,
        resourceId: "resource-123",
        resourceUri: null,
        resourceState: "change",
        messageNumber: 2,
        changed: [],
        channelExpiration: null
      },
      {
        expectedChannelId: "channel-123",
        expectedToken: "token-123",
        expectedResourceId: "resource-123"
      }
    );

    expect(result).toEqual({
      ok: false,
      status: 400,
      reason: "missing_channel_id"
    });
  });
});

describe("buildDriveWebhookPayload", () => {
  it("creates the payload sent from Next to the single n8n incremental workflow", () => {
    const payload = buildDriveWebhookPayload({
      scope: "documents_root",
      notificationId: 17,
      notification: {
        channelId: "channel-123",
        channelToken: "token-123",
        resourceId: "resource-123",
        resourceUri: "https://www.googleapis.com/drive/v3/changes",
        resourceState: "change",
        messageNumber: 2,
        changed: ["children"],
        channelExpiration: null
      }
    });

    expect(payload).toEqual({
      scope: "documents_root",
      notificationId: 17,
      source: "google_drive_push",
      channelId: "channel-123",
      resourceId: "resource-123",
      resourceState: "change",
      messageNumber: 2,
      changed: ["children"]
    });
  });
});
