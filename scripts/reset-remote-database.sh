#!/bin/bash
# Complete reset of remote D1 database - drops all tables

echo "⚠️  WARNING: This will drop ALL tables in the remote database!"
echo "Data backup exists at: ./archive/database-export-20251008-025736"
echo ""
echo "Dropping all tables from remote database..."

# Get list of all tables
TABLES=$(npx wrangler d1 execute cme-content-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'" --json | jq -r '.[0].results[].name')

for table in $TABLES; do
  echo "  Dropping table: $table"
  npx wrangler d1 execute cme-content-db --remote --command="DROP TABLE IF EXISTS $table"
done

echo "✅ All tables dropped"
echo ""
echo "Verifying database is empty..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'"
