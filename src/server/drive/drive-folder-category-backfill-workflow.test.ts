import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflowPath = "docs/n8n/2026-09-06-drive-folder-category-backfill-workflow.json";

describe("drive folder category backfill workflow export", () => {
  it("defines a manual workflow that maps Drive folders to existing category nodes", () => {
    expect(existsSync(workflowPath)).toBe(true);

    const [workflow] = JSON.parse(readFileSync(workflowPath, "utf8")) as [
      {
        id: string;
        active: boolean;
        nodes: Array<{
          name: string;
          parameters: {
            query?: string;
            jsCode?: string;
          };
        }>;
      },
    ];

    expect(workflow.id).toBe("proyecto1DriveFolderCategoryBackfill");
    expect(workflow.active).toBe(false);
    expect(workflow.nodes.map((node) => node.name)).toEqual([
      "Manual Trigger",
      "Config",
      "Inicializar carpetas",
      "Preparar carpeta",
      "Listar subcarpetas",
      "Preparar filas de carpetas",
      "Guardar carpetas y mapear categorias",
      "Acumular subcarpetas",
      "Quedan carpetas?",
    ]);

    const saveNode = workflow.nodes.find(
      (node) => node.name === "Guardar carpetas y mapear categorias",
    );
    const sql = saveNode?.parameters.query.toLowerCase();

    expect(sql).toContain("insert into drive_items");
    expect(sql).toContain("item_type");
    expect(sql).toContain("'folder'");
    expect(sql).toContain("update category_nodes");
    expect(sql).toContain("drive_folder_id");
    expect(sql).not.toContain("insert into category_nodes");
    expect(sql).not.toContain("resolve_category_node");
  });
});
