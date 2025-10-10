# Hero Image Failure Diagnostic

## Problem Statement
Home route hero image worked in previous browser session, doesn't work now. No code changes made between sessions.

## Diagnostic Steps

### Step 1: Verify Dev Server State
```bash
# Check if worker is running
lsof -i :8787

# Restart if needed
npm run dev:worker
```

### Step 2: Check Homepage Variable Generation
**File**: `src/utils/template-variable-generator.ts` → `generateBlogListingVariables()`

**Expected output**: Should include `HERO_CONTENT` variable with:
- Title
- Featured image URL
- Overlay styling

**Test**:
```bash
# Access homepage and check console logs
curl http://localhost:8787/ | grep -i hero
```

### Step 3: Check Template Rendering
**File**: `src/utils/template-renderer.ts` → `renderPage()`

**Expected**: Should replace `{{HERO_CONTENT}}` placeholder in page frame

**Test**: View page source, search for:
- `<div class="blog-hero"` - Should exist
- `background-image:` - Should have CDN URL
- Empty `{{HERO_CONTENT}}` - Indicates variable not replaced

### Step 4: Check Database for Hero Post
```bash
# Check if there's a designated hero post
npx wrangler d1 execute cme-content --command="SELECT id, title, featured_image_url, status FROM posts WHERE status='published' ORDER BY published_date DESC LIMIT 1"
```

### Step 5: Check CDN Asset Availability
If featured image URL found, verify it loads:
```bash
curl -I https://cdn.cruisemadeeasy.com/[image-path]
```

## Common Root Causes

### 1. Cache Mismatch
**Symptom**: Browser cache serving old HTML without hero
**Fix**: Hard refresh (Ctrl+Shift+R) or clear browser cache

### 2. Worker Not Restarted
**Symptom**: Code changes not reflected, stale template cached in memory
**Fix**: Kill worker process, restart `npm run dev:worker`

### 3. Template Variable Undefined
**Symptom**: `{{HERO_CONTENT}}` appears in source (not replaced)
**Fix**: Check `generateBlogListingVariables()` returns `HERO_CONTENT` key

### 4. No Published Posts
**Symptom**: Query returns empty, no hero data to display
**Fix**: Ensure at least one post has `status='published'` and `featured_image_url` set

### 5. CDN URL Resolution Broke
**Symptom**: Hero HTML exists but image URL is broken/empty
**Fix**: Check `resolveAssetUrl()` function in variable generator

## Immediate Action Plan

1. **Check browser console** - Any JavaScript errors?
2. **View page source** - Is `{{HERO_CONTENT}}` present (not replaced)?
3. **Check network tab** - Is hero image URL attempted? What's the response code?
4. **Restart dev server** - Kill and restart `npm run dev:worker`
5. **Hard refresh browser** - Ctrl+Shift+R to bypass cache

## Expected Behavior

**Working state**:
- Homepage loads
- Hero section visible with featured image overlay
- Image URL: `https://cdn.cruisemadeeasy.com/...`
- Console shows: `🏠 Rendering homepage with template system`

**Broken state**:
- Homepage loads
- Hero section missing OR shows without image
- View source shows either:
  - `{{HERO_CONTENT}}` unreplaced
  - Empty `<div class="blog-hero"></div>`
  - Image URL is `undefined` or empty string

## Next Steps

Once you complete Steps 1-3 above, report back:
1. What does view source show for hero section?
2. Any console errors in browser or worker logs?
3. Did restart fix it?

This will identify whether it's:
- Template variable generation (Step 2)
- Template rendering (Step 3)
- Environmental (Steps 1, 4, 5)
