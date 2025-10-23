# Database Migrations

This extension uses Drizzle ORM with a migration-based approach for database schema management.

## How it works

1. **Schema Definition**: The database schema is defined in `src/db/schema.ts` using Drizzle ORM's TypeScript API.

2. **Migration Generation**: When you modify the schema, run `pnpm run db:generate` to create SQL migration files in `src/db/migrations/`.

3. **Migration Execution**: Migrations are automatically applied when the extension starts via the `runMigrations()` function in `src/db/index.ts`.

4. **Version Tracking**: The `db_properties` table stores the database version, allowing the extension to detect and migrate older database schemas.

## Workflow

### Creating a new migration

1. Modify the schema in `src/db/schema.ts`
2. Run the migration generator:

   ```bash
   pnpm run db:generate
   ```

3. Review the generated SQL file in `src/db/migrations/`
4. Commit the migration files to version control

### Migration files

Migration files are:

- Generated in `src/db/migrations/`
- Automatically copied to `dist/db/migrations/` during build
- Applied in order when the extension starts

## Database initialization

The database is initialized automatically on first run:

1. Extension creates the database file if it doesn't exist
2. Migrations run automatically via `runMigrations()`
3. Tables and schema are created from the migration files
4. The `db_properties` table tracks the current schema version

## Future schema changes

When you need to evolve the schema:

1. Update `src/db/schema.ts` with your changes
2. Generate a new migration with `pnpm run db:generate`
3. The new migration will be applied automatically to existing databases

The migration system ensures:

- ✅ Users with older databases get automatic schema updates
- ✅ New installations start with the latest schema
- ✅ Schema changes are version-controlled and reproducible
- ✅ No data loss during schema evolution
