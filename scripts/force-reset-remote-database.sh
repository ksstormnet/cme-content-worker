#!/bin/bash
# Force reset of remote D1 database - disables foreign keys first

echo "⚠️  FORCE RESET: Disabling foreign keys and dropping ALL tables"
echo ""

# Disable foreign keys
echo "Disabling foreign key constraints..."
npx wrangler d1 execute cme-content-db --remote --command="PRAGMA foreign_keys = OFF"

# Get list of all tables
echo "Getting table list..."
TABLES=$(npx wrangler d1 execute cme-content-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'" --json | jq -r '.[0].results[].name')

for table in $TABLES; do
  echo "  Dropping table: $table"
  npx wrangler d1 execute cme-content-db --remote --command="DROP TABLE IF EXISTS $table"
done

echo "✅ All tables dropped"
echo ""
echo "Verifying database is empty..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT COUNT(*) as remaining_tables FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'"
