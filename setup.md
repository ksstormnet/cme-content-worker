# CME Content Worker Setup

## Prerequisites
- Cloudflare account with Workers and D1 enabled
- Wrangler CLI installed (`npm install -g wrangler`)
- API keys for OpenAI, Claude (Anthropic), DataForSEO

## Database Setup

1. **Create D1 database:**
   ```bash
   wrangler d1 create cme-content-db
   ```
   
2. **Update wrangler.json with database ID:**
   Replace `"database_id": "TBD"` with the actual database ID from step 1.

3. **Run database migrations:**
   ```bash
   wrangler d1 execute cme-content-db --file=./schema.sql
   ```

## R2 Bucket Setup

1. **Create R2 bucket for images:**
   ```bash
   wrangler r2 bucket create cme-content-images
   ```

## Environment Setup

1. **Set secrets (API keys):**
   ```bash
   wrangler secret put OPENAI_API_KEY
   wrangler secret put CLAUDE_API_KEY  
   wrangler secret put DATAFORSEO_APIUSER
   wrangler secret put DATAFORSEO_APIKEY
   wrangler secret put JWT_SECRET
   ```

2. **Update variables in wrangler.json:**
   - Change `SESSION_SECRET` to a random string
   - Update `ADMIN_EMAIL` to your email

## Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Deploy to production:**
   ```bash
   npm run deploy
   ```

## Initial Login

- **URL:** `https://blog.cruisemadeeasy.com/`
- **Email:** `admin@cruisemadeeasy.com`  
- **Password:** `admin123` (change immediately!)

## Custom Domain Setup

1. **Add custom domain in Cloudflare Workers dashboard:**
   - Go to your Worker → Settings → Triggers
   - Add custom domain: `blog.cruisemadeeasy.com`

2. **Configure DNS:**
   Add CNAME record: `blog.cruisemadeeasy.com` → `your-worker.your-subdomain.workers.dev`

## Configuration

All admin settings are configurable via `/admin`:
- Blog URL pattern for routing
- CSS URLs to monitor
- AI model preferences  
- Auto-publish settings
- API keys management

## Architecture Notes

- **Authentication:** JWT tokens stored in httpOnly cookies
- **Database:** Cloudflare D1 (SQLite)
- **File Storage:** Cloudflare R2 for images  
- **AI Integration:** OpenAI + Claude with cost optimization
- **CSS Sync:** Automatic detection of theme changes
- **Content Flow:** Generate → Edit → Approve → Schedule → Publish