import oracledb from 'oracledb';
import { env } from '@config/env';

/**
 * Thin Oracle helper for reading test data.
 * Uses node-oracledb "thin" mode (default since v6) — no Oracle Instant Client needed in Docker.
 */
let pool: oracledb.Pool | undefined;

async function getPool(): Promise<oracledb.Pool> {
  if (!pool) {
    pool = await oracledb.createPool({ ...env.db(), poolMin: 0, poolMax: 4 });
  }
  return pool;
}

export async function query<T>(sql: string, binds: oracledb.BindParameters = {}): Promise<T[]> {
  const conn = await (await getPool()).getConnection();
  try {
    const result = await conn.execute<T>(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    return result.rows ?? [];
  } finally {
    await conn.close();
  }
}

export async function queryOne<T>(sql: string, binds: oracledb.BindParameters = {}): Promise<T> {
  const [row] = await query<T>(sql, binds);
  if (!row) throw new Error(`No test data returned for query:\n${sql}`);
  return row;
}

export async function closeDb(): Promise<void> {
  await pool?.close(5);
  pool = undefined;
}
