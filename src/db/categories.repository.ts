import { getDbPool } from "@/db/client";
import type { CategoryNodeRow } from "@/db/types";

interface CategoryNodeDbRow {
  id: string;
  parent_id: string | null;
  name: string;
  active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

function toCategoryNode(row: CategoryNodeDbRow): CategoryNodeRow {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    active: row.active,
    sortOrder: row.sort_order,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function listCategoryNodes(): Promise<CategoryNodeRow[]> {
  const result = await getDbPool().query<CategoryNodeDbRow>(
    `
      select id, parent_id, name, active, sort_order, created_at, updated_at
      from category_nodes
      order by sort_order asc, name asc
    `
  );

  return result.rows.map(toCategoryNode);
}

export async function listRootCategoryNodes(): Promise<CategoryNodeRow[]> {
  const result = await getDbPool().query<CategoryNodeDbRow>(
    `
      select id, parent_id, name, active, sort_order, created_at, updated_at
      from category_nodes
      where parent_id is null and active = true
      order by sort_order asc, name asc
    `
  );

  return result.rows.map(toCategoryNode);
}

export async function listChildCategoryNodes(
  parentId: string
): Promise<CategoryNodeRow[]> {
  const result = await getDbPool().query<CategoryNodeDbRow>(
    `
      select id, parent_id, name, active, sort_order, created_at, updated_at
      from category_nodes
      where parent_id = $1 and active = true
      order by sort_order asc, name asc
    `,
    [parentId]
  );

  return result.rows.map(toCategoryNode);
}
