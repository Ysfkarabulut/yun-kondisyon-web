import { neon } from '@neondatabase/serverless';

function getConnectionString(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL ||
    process.env.VERCEL_POSTGRES_URL ||
    null
  );
}

export function isDbConfigured(): boolean {
  return Boolean(getConnectionString());
}

export function getDb() {
  const url = getConnectionString();
  if (!url) return null;
  return neon(url);
}

export async function initDb() {
  const sql = getDb();
  if (!sql) return false;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS yun_store (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `;
    return true;
  } catch (err) {
    console.error('Failed to init database table:', err);
    throw err;
  }
}
