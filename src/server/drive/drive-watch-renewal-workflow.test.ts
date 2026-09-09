import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflowPath = "docs/n8n/2026-09-06-drive-watch-renewal-workflow.json";

describe("drive watch renewal workflow export", () => {
  it("defines an inactive workflow that registers or renews Google Drive changes.watch", () => {
    expect(existsSync(workflowPath)).toBe(true);

    const [workflow] = JSON.parse(readFileSync(workflowPath, "utf8")) as [
      {
        id: string;
        active: boolean;
        nodes: Array<{
          name: string;
          parameters: {
            url?: string;
            query?: string;
          };
        }>;
      },
    ];

    expect(workflow.id).toBe("proyecto1DriveWatchRenewal");
    expect(workflow.active).toBe(false);
    expect(workflow.nodes.map((node) => node.name)).toEqual([
      "Manual Trigger",
      "Renovar cada dia",
      "Config watch",
      "Obtener cursor Drive",
      "Registrar watch Drive",
      "Guardar estado watch",
    ]);

    const urls = workflow.nodes.map((node) => node.parameters.url ?? "");
    expect(urls.join("\n")).toContain("/drive/v3/changes/startPageToken");
    expect(urls.join("\n")).toContain("/drive/v3/changes/watch");
    const watchNode = workflow.nodes.find(
      (node) => node.name === "Registrar watch Drive"
    );
    expect(JSON.stringify(watchNode)).toContain("\"specifyBody\":\"json\"");
    expect(JSON.stringify(watchNode)).toContain("web_hook");

    const sql = workflow.nodes
      .map((node) => node.parameters.query ?? "")
      .join("\n")
      .toLowerCase();
    expect(sql).toContain("update drive_sync_state");
    expect(sql).toContain("watch_channel_id");
    expect(sql).toContain("watch_resource_id");
    expect(sql).toContain("watch_expiration_at");
  });
});
