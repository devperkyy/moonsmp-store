// Flips the Prisma datasource provider between local SQLite dev and
// production Postgres. `npm run build` always forces postgres, so a local
// sqlite state can never leak into a Vercel deploy.
//
//   node scripts/set-db.mjs sqlite     → local dev (file:./dev.db)
//   node scripts/set-db.mjs postgres   → production (DATABASE_URL)
import { readFileSync, writeFileSync } from "node:fs";

const target = process.argv[2];
if (!["sqlite", "postgres"].includes(target)) {
  console.error("usage: node scripts/set-db.mjs <sqlite|postgres>");
  process.exit(1);
}

const schemaPath = new URL("../prisma/schema.prisma", import.meta.url);
const provider = target === "postgres" ? "postgresql" : "sqlite";
const schema = readFileSync(schemaPath, "utf8");
const updated = schema.replace(
  /provider = "(postgresql|sqlite)"/,
  `provider = "${provider}"`
);
writeFileSync(schemaPath, updated);
console.log(`prisma datasource provider → ${provider}`);
