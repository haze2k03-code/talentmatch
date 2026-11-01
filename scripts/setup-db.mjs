// Creates the tables, the matching view and the seed data.
// Usage: npm run db:setup   (reads DATABASE_URL from .env.local)
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

// Order matters: the seed's pipeline rows are picked using the match_scores view.
const files = ["schema.sql", "matching.sql", "seed.sql"];
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  for (const file of files) {
    const sql = readFileSync(join("db", file), "utf8");
    await client.query(sql);
    console.log(`✓ ran db/${file}`);
  }
  const { rows } = await client.query(
    "SELECT (SELECT count(*) FROM clients)::int AS clients, (SELECT count(*) FROM roles)::int AS roles, (SELECT count(*) FROM pipeline)::int AS pipeline"
  );
  console.log(`Done: ${rows[0].clients} clients, ${rows[0].roles} roles, ${rows[0].pipeline} pipeline rows.`);
} catch (err) {
  console.error("Database setup failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
