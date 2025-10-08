#!/bin/bash
# Export all data from remote D1 database before migration reset

EXPORT_DIR="./archive/database-export-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$EXPORT_DIR"

echo "📦 Exporting remote database to: $EXPORT_DIR"

# Export posts
echo "Exporting posts..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT * FROM posts" --json > "$EXPORT_DIR/posts.json"

# Export content_blocks
echo "Exporting content_blocks..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT * FROM content_blocks" --json > "$EXPORT_DIR/content_blocks.json"

# Export users
echo "Exporting users..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT * FROM users" --json > "$EXPORT_DIR/users.json"

# Export categories
echo "Exporting categories..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT * FROM categories" --json > "$EXPORT_DIR/categories.json"

# Export tags
echo "Exporting tags..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT * FROM tags" --json > "$EXPORT_DIR/tags.json"

# Export post_tags
echo "Exporting post_tags..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT * FROM post_tags" --json > "$EXPORT_DIR/post_tags.json"

# Export settings
echo "Exporting settings..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT * FROM settings" --json > "$EXPORT_DIR/settings.json"

# Export images
echo "Exporting images..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT * FROM images" --json > "$EXPORT_DIR/images.json"

# Export media_files
echo "Exporting media_files..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT * FROM media_files" --json > "$EXPORT_DIR/media_files.json"

# Export media_categories
echo "Exporting media_categories..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT * FROM media_categories" --json > "$EXPORT_DIR/media_categories.json"

# Export media_usage
echo "Exporting media_usage..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT * FROM media_usage" --json > "$EXPORT_DIR/media_usage.json"

# Export content_plans
echo "Exporting content_plans..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT * FROM content_plans" --json > "$EXPORT_DIR/content_plans.json"

# Export content_calendar
echo "Exporting content_calendar..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT * FROM content_calendar" --json > "$EXPORT_DIR/content_calendar.json"

# Export weekly_content_plans
echo "Exporting weekly_content_plans..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT * FROM weekly_content_plans" --json > "$EXPORT_DIR/weekly_content_plans.json"

# Export ai_generations
echo "Exporting ai_generations..."
npx wrangler d1 execute cme-content-db --remote --command="SELECT * FROM ai_generations" --json > "$EXPORT_DIR/ai_generations.json"

echo "✅ Export complete: $EXPORT_DIR"
echo ""
echo "📊 Summary:"
wc -l "$EXPORT_DIR"/*.json
