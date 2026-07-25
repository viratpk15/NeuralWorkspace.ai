# Database Migrations

This directory contains database migration files and scripts for the NeuralWorkspace backend.

## Prerequisites

- `DATABASE_URL` environment variable must be set
- PostgreSQL database must be provisioned

## Usage

### Generate Migrations

Generate SQL migration files from the current schema:

```bash
pnpm --filter @workspace/db db:generate
```

Or from the backend:

```bash
cd backend
pnpm db:generate
```

This will create timestamped SQL files in `lib/db/migrations/`.

### Run Migrations

Apply all pending migrations to the database:

```bash
pnpm --filter @workspace/db db:migrate
```

Or from the backend:

```bash
cd backend
pnpm db:migrate
```

This will:
1. Read all migration files from `lib/db/migrations/`
2. Apply them in order to the database
3. Track which migrations have been applied via `__drizzle_migrations` table

## Railway Deployment

Railway automatically provisions a PostgreSQL database for your project. The `DATABASE_URL` is available as an environment variable.

To run migrations on Railway:

```bash
cd backend
pnpm db:migrate
```

This will apply all pending migrations to your Railway PostgreSQL database.

## Notes

- The `drizzle.config.ts` file uses the project's `DATABASE_URL` environment variable
- Migration files are output to `lib/db/migrations/`
- The schema is defined in `lib/db/src/schema/`
- The database connection is in `lib/db/src/index.ts`

## Troubleshooting

If you encounter errors about missing tables:

1. Verify `DATABASE_URL` is set in your `.env` file
2. Ensure migrations have been generated: `pnpm db:generate`
3. Run migrations: `pnpm db:migrate`
4. On Railway, ensure the database is provisioned and `DATABASE_URL` is set as an environment variable