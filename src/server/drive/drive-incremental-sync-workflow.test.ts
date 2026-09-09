import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflowPath = "docs/n8n/2026-09-06-drive-incremental-sync-workflow.json";

describe("drive incremental sync workflow export", () => {
  it("defines one inactive webhook workflow called by Next and applies document actions directly", () => {
    expect(existsSync(workflowPath)).toBe(true);

    const [workflow] = JSON.parse(readFileSync(workflowPath, "utf8")) as [
      {
        id: string;
        active: boolean;
        nodes: Array<{
          name: string;
          type: string;
          webhookId?: string;
          parameters: {
            query?: string;
            path?: string;
          };
        }>;
      },
    ];

    expect(workflow.id).toBe("proyecto1DriveIncrementalSync");
    expect(workflow.active).toBe(false);
    expect(workflow.nodes.map((node) => node.name)).toEqual([
      "Webhook Next",
      "Validar token Next",
      "Leer estado Drive",
      "Tiene cursor?",
      "Obtener cursor inicial",
      "Guardar cursor inicial",
      "Listar cambios Drive",
      "Sincronizar cambios y documentos",
      "Emitir archivos nuevos a extraer",
      "Hay archivos nuevos?",
      "Descargar archivo nuevo",
      "Calcular SHA256",
      "Preparar metadata con hash",
      "Es PDF?",
      "Extraer texto PDF",
      "Normalizar extracción PDF",
      "Marcar requiere OCR",
      "Necesita OCR/Vision issuer?",
      "Inferir entidad pagadora OCR/Vision",
      "Guardar documento extraido",
    ]);
    expect(workflow.nodes.some((node) => node.type.includes("cron"))).toBe(false);
    expect(workflow.nodes.some((node) => node.type.includes("manualTrigger"))).toBe(
      false
    );

    const webhookNode = workflow.nodes.find(
      (node) => node.name === "Webhook Next"
    );
    expect(webhookNode?.type).toBe("n8n-nodes-base.webhook");
    expect(webhookNode?.webhookId).toBeTruthy();
    expect(webhookNode?.parameters.path).toBe("proyecto1-drive-incremental-sync");
    expect(JSON.stringify(webhookNode?.parameters)).toContain("onReceived");

    const validationNode = workflow.nodes.find(
      (node) => node.name === "Validar token Next"
    );
    expect(JSON.stringify(validationNode).toLowerCase()).toContain(
      "n8n_drive_incremental_webhook_token"
    );
    expect(JSON.stringify(validationNode).toLowerCase()).toContain(
      "missing_next_webhook_token_config"
    );

    const syncNode = workflow.nodes.find(
      (node) => node.name === "Sincronizar cambios y documentos",
    );
    const sql = syncNode?.parameters.query.toLowerCase();

    expect(sql).toContain("insert into drive_change_events");
    expect(sql).toContain("insert into documents");
    expect(sql).toContain("duplicate_candidate");
    expect(sql).toContain("d.drive_md5_checksum = p.md5_checksum");
    expect(sql).toContain("parent_item.category_node_id as parent_category_node_id");
    expect(sql).toContain("coalesce(d.parent_category_node_id, d.old_category_node_id)");
    expect(sql).toContain("raw_metadata = drive_items.raw_metadata || excluded.raw_metadata");
    expect(sql).toContain("renamed_category_nodes as");
    expect(sql).toContain("moved_category_nodes as");
    expect(sql).toContain("category_node_id = coalesce(p.parent_category_node_id, d.category_node_id)");
    expect(sql).toContain("removed_reason = 'trashed'");
    expect(sql).toContain("removed_reason = 'moved_out_of_scope'");
    expect(sql).toContain("update drive_sync_state");
    expect(sql).toContain("processed_at");

    const emitNode = workflow.nodes.find(
      (node) => node.name === "Emitir archivos nuevos a extraer"
    );
    const emitSql = emitNode?.parameters.query.toLowerCase();
    expect(emitSql).toContain("event.event_type = 'created'");
    expect(emitSql).toContain("event.event_type = 'metadata_changed'");
    expect(emitSql).toContain("pdf_text_extraction_error");
    expect(emitSql).toContain("drive_item_id");
    expect(emitSql).toContain("category_path");

    const hasNewFilesNode = workflow.nodes.find(
      (node) => node.name === "Hay archivos nuevos?"
    );
    expect(hasNewFilesNode?.type).toBe("n8n-nodes-base.if");
    expect(JSON.stringify(hasNewFilesNode).toLowerCase()).toContain("drive_file_id");

    const saveNode = workflow.nodes.find(
      (node) => node.name === "Guardar documento extraido"
    );
    const saveSql = saveNode?.parameters.query.toLowerCase();
    expect(saveSql).toContain("insert into documents");
    expect(saveSql).toContain("covered_fiscal_months");
    expect(saveSql).toContain("drive_item_id");

    const normalizerNode = workflow.nodes.find(
      (node) => node.name === "Normalizar extracción PDF"
    );
    expect(JSON.stringify(normalizerNode)).toContain("Patentes Vehiculos");
    expect(JSON.stringify(normalizerNode)).toContain("#page=");

    const issuerVisionNode = workflow.nodes.find(
      (node) => node.name === "Inferir entidad pagadora OCR/Vision"
    );
    expect(JSON.stringify(issuerVisionNode)).toContain(
      "ocr_or_vision_runtime_unavailable"
    );

    const downloadConnections = workflow.connections["Descargar archivo nuevo"]
      ?.main?.[0]
      ?.map((connection) => connection.node);
    expect(downloadConnections).toEqual(["Preparar metadata con hash"]);
    expect(
      workflow.connections["Preparar metadata con hash"]?.main?.[0]?.map(
        (connection) => connection.node
      )
    ).toEqual(["Es PDF?"]);
  });

  it("keeps the manual fiscal-period range behavior for files like 04-05-26.pdf", () => {
    const [workflow] = JSON.parse(readFileSync(workflowPath, "utf8")) as [
      {
        nodes: Array<{
          name: string;
          parameters: {
            jsCode?: string;
          };
        }>;
      },
    ];
    const normalizerNode = workflow.nodes.find(
      (node) => node.name === "Normalizar extracción PDF"
    );
    const jsCode = normalizerNode?.parameters.jsCode;
    expect(jsCode).toBeTruthy();

    const result = Function(
      "items",
      "$",
      jsCode ?? ""
    )(
      [
        {
          json: {
            name: "04-05-26.pdf",
            drive_file_id: "range-test-file",
            drive_item_id: "range-test-file",
            drive_path: "Sindicatos/Setia/2026/04-05-26.pdf",
            category_path: ["Sindicatos", "Setia"],
            processing_year: 2026,
            mimeType: "application/pdf",
            text:
              "Banco Credicoop Coop. Ltdo. Servicio: SETIA Vencimiento Importe 10/05/2026 1.234,56 Nro Transaccion 123456789 ".repeat(
                2
              )
          },
          binary: {}
        }
      ],
      (nodeName: string) => ({
        all: () =>
          nodeName === "Preparar metadata con hash"
            ? [
                {
                  json: {
                    name: "04-05-26.pdf",
                    drive_file_id: "range-test-file",
                    drive_item_id: "range-test-file",
                    drive_path: "Sindicatos/Setia/2026/04-05-26.pdf",
                    category_path: ["Sindicatos", "Setia"],
                    processing_year: 2026,
                    mimeType: "application/pdf",
                    content_hash: "sha256-test",
                    content_hash_algorithm: "sha256",
                    drive_md5_checksum: "md5-test",
                    md5Checksum: "md5-test",
                  },
                },
              ]
            : [],
      })
    ) as Array<{
      json: {
        fiscal_period_year: number;
        fiscal_period_month: number;
        fiscal_period_kind: string;
        covered_fiscal_months: number[];
        content_hash: string;
        content_hash_algorithm: string;
        drive_md5_checksum: string;
        extracted_data: {
          fiscal_period_source: string;
          covered_fiscal_months: number[];
        };
      };
    }>;

    expect(result).toHaveLength(1);
    expect(result[0].json.fiscal_period_year).toBe(2026);
    expect(result[0].json.fiscal_period_month).toBe(5);
    expect(result[0].json.fiscal_period_kind).toBe("month");
    expect(result[0].json.covered_fiscal_months).toEqual([4, 5]);
    expect(result[0].json.content_hash).toBe("sha256-test");
    expect(result[0].json.content_hash_algorithm).toBe("sha256");
    expect(result[0].json.drive_md5_checksum).toBe("md5-test");
    expect(result[0].json.extracted_data.fiscal_period_source).toBe(
      "file_name_range"
    );
    expect(result[0].json.extracted_data.covered_fiscal_months).toEqual([4, 5]);
  });

  it("keeps the PDF text extraction path away from the Crypto node output", () => {
    const [workflow] = JSON.parse(readFileSync(workflowPath, "utf8")) as [
      {
        connections: Record<
          string,
          {
            main: Array<Array<{ node: string }>>;
          }
        >;
      },
    ];

    expect(
      workflow.connections["Descargar archivo nuevo"]?.main?.[0]?.map(
        (connection) => connection.node
      )
    ).toEqual(["Preparar metadata con hash"]);
    expect(
      workflow.connections["Calcular SHA256"]?.main?.[0]?.map(
        (connection) => connection.node
      )
    ).toEqual(["Preparar metadata con hash"]);
  });
});
