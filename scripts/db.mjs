/**
 * Applies a .sql file to the project's Supabase Postgres.
 *
 * Kept out of the app bundle deliberately — this is an operator tool, run by
 * hand:  node scripts/db.mjs supabase/migrations/0002_launch.sql
 *
 * Credentials are read from .env.local. Supabase publishes several Postgres
 * endpoints (direct IPv6, session pooler, transaction pooler) and which one
 * works depends on the project's region and the network you're on, so this
 * probes them and uses the first that answers.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// `pg` is an operator-only dependency; resolve it from wherever it's installed.
const require = createRequire(import.meta.url);
let pg;
for (const spec of ["pg", path.join(process.env.APPDATA ?? "", "npm/node_modules/pg")]) {
  try {
    pg = require(spec);
    break;
  } catch {
    /* try the next location */
  }
}
if (!pg) {
  console.error("pg is not installed. Run:  npm i -g pg");
  process.exit(1);
}

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

const REF = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const PASSWORD = env.DATABASE_PASS;

if (!PASSWORD) {
  console.error("DATABASE_PASS is not set in .env.local");
  process.exit(1);
}

const REGIONS = [
  "ap-south-1",
  "ap-southeast-1",
  "us-east-1",
  "us-east-2",
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "ap-northeast-1",
  "ap-southeast-2",
  "us-west-1",
  "ca-central-1",
  "sa-east-1",
];

const CANDIDATES = [
  { host: `db.${REF}.supabase.co`, port: 5432, user: "postgres" },
  ...REGIONS.flatMap((region) =>
    [0, 1].map((n) => ({
      host: `aws-${n}-${region}.pooler.supabase.com`,
      port: 5432,
      user: `postgres.${REF}`,
    }))
  ),
];

async function connect() {
  for (const candidate of CANDIDATES) {
    const client = new pg.Client({
      ...candidate,
      password: PASSWORD,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    try {
      await client.connect();
      await client.query("select 1");
      console.log(`connected via ${candidate.host}:${candidate.port}`);
      return client;
    } catch (error) {
      process.stdout.write(".");
      try {
        await client.end();
      } catch {
        /* already closed */
      }
    }
  }
  return null;
}

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/db.mjs <path-to.sql>");
  process.exit(1);
}

const client = await connect();
if (!client) {
  console.error(
    "\nNo Postgres endpoint reachable from this network.\n" +
      "Paste the SQL into the Supabase dashboard SQL editor instead."
  );
  process.exit(2);
}

const sql = fs.readFileSync(file, "utf8");
try {
  await client.query(sql);
  console.log(`applied ${file}`);
} catch (error) {
  console.error(`failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
