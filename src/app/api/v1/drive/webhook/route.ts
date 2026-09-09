import { NextResponse } from "next/server";

import { getServerEnv } from "@/server/env";
import {
  buildDriveWebhookPayload,
  parseDriveWebhookHeaders,
  validateDriveWebhookNotification
} from "@/server/drive/drive-webhook";
import { forwardDriveWebhookToN8n } from "@/server/drive/drive-webhook-forwarder";
import {
  getDriveWebhookState,
  markDriveWebhookForwardResult,
  recordDriveWebhookNotification
} from "@/server/drive/drive-webhook.repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const scope = "documents_root";

function headersToRecord(headers: Headers): Record<string, string> {
  const rawHeaders: Record<string, string> = {};

  for (const [key, value] of headers.entries()) {
    if (key.startsWith("x-goog-")) {
      rawHeaders[key] = value;
    }
  }

  return rawHeaders;
}

export async function POST(request: Request) {
  const env = getServerEnv();
  const state = await getDriveWebhookState(scope);

  if (!state) {
    return NextResponse.json(
      { accepted: false, reason: "drive_sync_state_not_found" },
      { status: 500 }
    );
  }

  const notification = parseDriveWebhookHeaders(request.headers);
  const validation = validateDriveWebhookNotification(notification, {
    expectedChannelId:
      state.watchChannelId ?? env.GOOGLE_DRIVE_WEBHOOK_CHANNEL_ID,
    expectedToken: state.watchToken ?? env.GOOGLE_DRIVE_WEBHOOK_TOKEN,
    expectedResourceId: state.watchResourceId
  });

  if (!validation.ok) {
    return NextResponse.json(
      { accepted: false, reason: validation.reason },
      { status: validation.status }
    );
  }

  const notificationId = await recordDriveWebhookNotification({
    scope,
    notification,
    rawHeaders: headersToRecord(request.headers)
  });

  const payload = buildDriveWebhookPayload({
    scope,
    notificationId,
    notification
  });
  const forwardResult = await forwardDriveWebhookToN8n({
    url: env.N8N_DRIVE_INCREMENTAL_WEBHOOK_URL,
    token: env.N8N_DRIVE_INCREMENTAL_WEBHOOK_TOKEN,
    payload
  });

  await markDriveWebhookForwardResult({
    notificationId,
    status: forwardResult.status,
    error: forwardResult.error
  });

  return NextResponse.json(
    {
      accepted: true,
      notificationId,
      forwarded: forwardResult.forwarded
    },
    { status: 202 }
  );
}
