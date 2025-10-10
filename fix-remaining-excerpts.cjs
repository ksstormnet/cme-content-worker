/**
 * Fix remaining HTML in post excerpts using JSON file
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Strip HTML tags
function stripHtml(html) {
  if (!html) return '';
  let text = html.replace(/<[^>]*>/g, '');
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/… Read more$/g, '');
  return text.replace(/\s+/g, ' ').trim();
}

// Failed post IDs
const failedIds = [62, 63, 66, 68, 71, 74];

console.log(`Fixing ${failedIds.length} remaining posts...\n`);

failedIds.forEach(id => {
  // Get the current excerpt
  const result = execSync(
    `npx wrangler d1 execute cme-content-db --remote --json --command="SELECT excerpt FROM posts WHERE id = ${id}"`,
    { encoding: 'utf-8' }
  );

  const data = JSON.parse(result);
  const excerpt = data[0].results[0]?.excerpt;

  if (!excerpt) {
    console.log(`✗ Post ${id} not found`);
    return;
  }

  const cleaned = stripHtml(excerpt);
  console.log(`\nPost ID: ${id}`);
  console.log(`Original: ${excerpt.substring(0, 80)}...`);
  console.log(`Cleaned:  ${cleaned.substring(0, 80)}...`);

  // Write SQL file for this update
  const sql = `UPDATE posts SET excerpt = ? WHERE id = ?;`;
  fs.writeFileSync(`/tmp/update-${id}.sql`, sql);

  // Create JSON file with parameters
  const params = JSON.stringify([cleaned, id]);
  fs.writeFileSync(`/tmp/params-${id}.json`, params);

  console.log(`✓ Created update files for post ${id}`);
});

console.log('\n--- Manual Update Commands ---');
console.log('Run these commands to update each post:\n');

failedIds.forEach(id => {
  console.log(`npx wrangler d1 execute cme-content-db --remote --file=/tmp/update-${id}.sql`);
});
