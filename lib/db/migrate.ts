import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./src/index";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

console.warn("Running database migrations...");

try {
  await migrate(db, { migrationsFolder: "./migrations" });
  console.warn("✓ Migrations completed successfully");
  process.exit(0);
} catch (error) {
  console.error("✗ Migration failed:", error);
  process.exit(1);
}