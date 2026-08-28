import pg from "pg";

import { getServerEnv } from "@/server/env";

const { Pool } = pg;

declare global {
  var financialDashboardPool: pg.Pool | undefined;
}

function createPool() {
  const env = getServerEnv();

  return new Pool({
    connectionString: env.DATABASE_URL
  });
}

export function getDbPool(): pg.Pool {
  if (!globalThis.financialDashboardPool) {
    globalThis.financialDashboardPool = createPool();
  }

  return globalThis.financialDashboardPool;
}
