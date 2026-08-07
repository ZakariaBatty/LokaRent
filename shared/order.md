# Validate schema

pnpm --filter @lokarent/db prisma:validate

# Generate Prisma Client

pnpm --filter @lokarent/db prisma:generate

# Open Prisma Studio

pnpm --filter @lokarent/db prisma:studio

# Create and apply development migration

pnpm --filter @lokarent/db migrate

# Create migration without applying it

pnpm --filter @lokarent/db migrate:create

# Check migration status

pnpm --filter @lokarent/db migrate:status

# Apply migrations in production

pnpm --filter @lokarent/db migrate:deploy

# Run seed

pnpm --filter @lokarent/db seed

# Format + validate + generate

pnpm --filter @lokarent/db check
