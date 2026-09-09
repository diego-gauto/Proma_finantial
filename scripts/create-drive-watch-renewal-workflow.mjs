import { mkdirSync, writeFileSync } from "node:fs";

const workflowId = "proyecto1DriveWatchRenewal";
const workflowName = "Proyecto 1 - Renovar watch Google Drive";

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

const saveWatchStateSql = `UPDATE drive_sync_state
SET
  start_page_token = COALESCE(start_page_token, $1),
  watch_channel_id = $2,
  watch_resource_id = $3,
  watch_expiration_at = to_timestamp(($4::numeric) / 1000),
  watch_token = $5,
  webhook_url = $6,
  last_error_at = NULL,
  last_error = NULL,
  updated_at = now()
WHERE scope = 'documents_root'
RETURNING
  scope,
  start_page_token,
  watch_channel_id,
  watch_resource_id,
  watch_expiration_at,
  webhook_url;`;

const nodes = [
  {
    parameters: {},
    id: "06e375b0-d199-42f2-bc0c-2708d1a8d101",
    name: "Manual Trigger",
    type: "n8n-nodes-base.manualTrigger",
    typeVersion: 1,
    position: [-980, -100],
  },
  {
    parameters: {
      rule: {
        interval: [
          {
            field: "days",
            daysInterval: 1,
          },
        ],
      },
    },
    id: "c79f4f38-0e49-4d95-a9e3-f926925ff102",
    name: "Renovar cada dia",
    type: "n8n-nodes-base.scheduleTrigger",
    typeVersion: 1.2,
    position: [-980, 120],
  },
  {
    parameters: {
      assignments: {
        assignments: [
          {
            id: "scope",
            name: "scope",
            value: "documents_root",
            type: "string",
          },
          {
            id: "channel-id",
            name: "channelId",
            value:
              "={{ 'proyecto1-documents-root-' + $now.toMillis().toString() }}",
            type: "string",
          },
          {
            id: "channel-token",
            name: "channelToken",
            value: "={{ $env.GOOGLE_DRIVE_WEBHOOK_TOKEN }}",
            type: "string",
          },
          {
            id: "webhook-url",
            name: "webhookUrl",
            value: "={{ $env.GOOGLE_DRIVE_WEBHOOK_URL }}",
            type: "string",
          },
          {
            id: "expiration",
            name: "expiration",
            value:
              "={{ ($now.toMillis() + (6 * 24 * 60 * 60 * 1000)).toString() }}",
            type: "string",
          },
        ],
      },
      options: {},
    },
    id: "47741f90-a535-4475-9847-8045cdeea201",
    name: "Config watch",
    type: "n8n-nodes-base.set",
    typeVersion: 3.4,
    position: [-720, 0],
  },
  {
    parameters: {
      method: "GET",
      url: "https://www.googleapis.com/drive/v3/changes/startPageToken",
      authentication: "predefinedCredentialType",
      nodeCredentialType: "googleDriveOAuth2Api",
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: "supportsAllDrives", value: "true" },
        ],
      },
      options: {},
    },
    id: "28e0d253-23bb-4974-b1bd-2a6735200a01",
    name: "Obtener cursor Drive",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [-460, 0],
    credentials: googleDriveCredentials,
  },
  {
    parameters: {
      method: "POST",
      url: "https://www.googleapis.com/drive/v3/changes/watch",
      authentication: "predefinedCredentialType",
      nodeCredentialType: "googleDriveOAuth2Api",
      sendQuery: true,
      queryParameters: {
        parameters: [
          {
            name: "pageToken",
            value: "={{ $('Obtener cursor Drive').first().json.startPageToken }}",
          },
          { name: "supportsAllDrives", value: "true" },
        ],
      },
      sendBody: true,
      contentType: "json",
      specifyBody: "json",
      jsonBody:
        "={{ JSON.stringify({ id: $('Config watch').first().json.channelId, type: 'web_hook', address: $('Config watch').first().json.webhookUrl, token: $('Config watch').first().json.channelToken, expiration: $('Config watch').first().json.expiration }) }}",
      options: {},
    },
    id: "22529607-1ee0-40f6-b1ed-f8a375122001",
    name: "Registrar watch Drive",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [-180, 0],
    credentials: googleDriveCredentials,
  },
  {
    parameters: {
      operation: "executeQuery",
      query: saveWatchStateSql,
      options: {
        queryReplacement:
          "={{ [$('Obtener cursor Drive').first().json.startPageToken, $('Config watch').first().json.channelId, $json.resourceId, $json.expiration, $('Config watch').first().json.channelToken, $('Config watch').first().json.webhookUrl] }}",
      },
    },
    id: "04747076-2897-4d8a-84d4-fd399373f001",
    name: "Guardar estado watch",
    type: "n8n-nodes-base.postgres",
    typeVersion: 2.6,
    position: [100, 0],
    credentials: postgresCredentials,
  },
];

const connections = {
  "Manual Trigger": {
    main: [[{ node: "Config watch", type: "main", index: 0 }]],
  },
  "Renovar cada dia": {
    main: [[{ node: "Config watch", type: "main", index: 0 }]],
  },
  "Config watch": {
    main: [[{ node: "Obtener cursor Drive", type: "main", index: 0 }]],
  },
  "Obtener cursor Drive": {
    main: [[{ node: "Registrar watch Drive", type: "main", index: 0 }]],
  },
  "Registrar watch Drive": {
    main: [[{ node: "Guardar estado watch", type: "main", index: 0 }]],
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
  versionId: "22fa3604-cb02-41fc-a2d4-d66dcb170001",
  triggerCount: 0,
  meta: {
    templateCredsSetupCompleted: true,
    stage: "drive-watch-renewal",
  },
  parentFolderId: null,
  isArchived: false,
  versionCounter: 1,
  description:
    "Workflow auxiliar: registra o renueva Google Drive changes.watch y guarda canal/recurso/expiracion para el webhook inmediato de Next.",
};

mkdirSync("docs/n8n", { recursive: true });
writeFileSync(
  "docs/n8n/2026-09-06-drive-watch-renewal-workflow.json",
  `${JSON.stringify([workflow], null, 2)}\n`,
);
writeFileSync(
  "/tmp/proyecto1_drive_watch_renewal_workflow.b64",
  Buffer.from(JSON.stringify(workflow)).toString("base64"),
);

console.log(`Wrote ${workflow.id} to docs/n8n/2026-09-06-drive-watch-renewal-workflow.json`);
