# CME Content Worker - Troubleshooting Guide

## Background Session Issues

### Problem: Sessions not starting or Claude session gets hijacked
**Solution**: Always use Claude's Bash tool with `run_in_background: true`

```bash
# CORRECT - Background sessions via Claude Bash tool
npm run dev:frontend    # Set run_in_background: true
npm run dev:worker      # Set run_in_background: true

# INCORRECT - These will block Claude session
npm run dev:frontend    # Without background flag
npm run dev:worker      # Without background flag
```

### Problem: Worker auth login issues
**Solution**: Use local mode for development

```bash
# If getting auth errors, use local mode
npm run dev:worker -- --local
```

### Problem: Ports already in use
**Solution**: Clear ports before starting

```bash
# Check what's using the ports
lsof -i:5174 -i:8787 | grep LISTEN

# Kill existing processes
npm run dev:bg-stop
# or manually:
pkill -f 'wrangler dev' && pkill -f vite
```

### Problem: Sessions status checking
**Solution**: Use non-blocking status commands

```bash
# Check session status without blocking Claude
npm run dev:bg-status

# Verify both servers are running
lsof -i:5174 -i:8787 | grep LISTEN
```

## Routing Issues

### Problem: Blog routes not loading in development
**Cause**: Vite should handle ALL routes in development

**Check**:
1. Vite server running on localhost:5174? 
2. React Router configured for blog routes?
3. API endpoints accessible at localhost:8787?

### Problem: Admin routes broken
**Cause**: Route precedence issues in App.tsx

**Check**: Blog routes should come BEFORE admin routes in React Router to avoid conflicts.

### Problem: API calls failing
**Cause**: Worker not running or wrong endpoints

**Check**:
```bash
# Test API health
curl http://localhost:8787/api/health

# Test posts API
curl http://localhost:8787/api/posts
```

## Build Issues

### Problem: Build failing
**Solution**: Run full check process

```bash
# Full build validation
npm run check

# Individual steps for debugging
tsc                           # TypeScript check
vite build                   # React build
wrangler deploy --dry-run    # Worker deployment check
```

### Problem: Assets not found in production
**Cause**: Asset directory misconfiguration

**Check**: wrangler.json production environment should have:
```json
"assets": {
  "directory": "./dist/client",
  "not_found_handling": "single-page-application"
}
```

## Development vs Production

### Development Architecture
- **Vite (localhost:5174)**: ALL routes via React Router + API proxy
- **Worker (localhost:8787)**: API endpoints only
- **Blog routes**: Handled by React Router with API data fetching

### Production Architecture  
- **Worker**: Static assets + blog SSR + admin SPA + API endpoints
- **Vite**: Not running (build artifacts served by Worker)
- **Blog routes**: Server-side rendered with database content

## Common Error Messages

### "Port already in use"
```bash
# Solution
npm run dev:bg-stop
# Wait 5 seconds, then restart sessions
```

### "Worker dev remote mode requires login"
```bash
# Solution
npm run dev:worker -- --local
```

### "Cannot resolve module"
```bash
# Solution - regenerate types
npm run cf-typegen
```

### React Router "Cannot resolve route"
**Cause**: Route order in App.tsx or missing route definition

**Check**: Blog routes (/, /category/:slug, /:category/:slug) should be defined before admin routes.

## Performance Issues

### Slow development startup
**Cause**: Multiple server startup

**Solution**: Start sessions sequentially, Vite first:
1. Start Vite background session
2. Wait for ready message
3. Start Worker background session

### Large bundle size warnings
**Normal**: React app is large due to rich editing features. Consider code splitting if needed.

## Environment Variables

### Development (.dev.vars)
```
ENVIRONMENT=development
SESSION_SECRET=change-this-secret-key
ADMIN_EMAIL=admin@cruisemadeeasy.com
```

### Production (wrangler secret)
```bash
# Set production secrets
wrangler secret put JWT_SECRET
wrangler secret put OPENAI_API_KEY
wrangler secret put CLAUDE_API_KEY
```

## Emergency Recovery

### Complete session reset
```bash
# Kill everything
pkill -f node
pkill -f wrangler
pkill -f vite

# Clear ports
lsof -ti:5174 | xargs kill -9
lsof -ti:8787 | xargs kill -9

# Restart via Claude background sessions
npm run dev:frontend    # Background: true
npm run dev:worker      # Background: true
```

### Database connection issues
```bash
# Test D1 connection
npx wrangler d1 execute --command="SELECT 1" 

# Check migrations
npx wrangler d1 migrations list
```

---

**Remember**: Always use background sessions via Claude's Bash tool. Never run development servers in foreground that block Claude's session.