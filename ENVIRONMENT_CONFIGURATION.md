# Environment Configuration Checklist

**CRITICAL**: Complete environment setup required for production-only development approach.

## Required Environment Variables

### **Cloudflare Worker Configuration**
```bash
# Worker deployment
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_api_token_with_worker_permissions

# Environment mode (CRITICAL: Always production for blog development)
ENVIRONMENT=production
WORKER_URL=cme-content-worker.ksstorm.workers.dev
```

### **Database Configuration**
```bash
# D1 Database (Remote production instance)
DATABASE_ID=58de4dc4-0900-4b28-9ccc-5d066557bb11
DB_NAME=cme-content-worker-db

# Database connection (handled by Cloudflare binding)
# No connection strings needed - uses Cloudflare's D1 binding system
```

### **R2 Storage Configuration**
```bash
# R2 Bucket for images
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=cruisemadeeasy-images

# R2 Custom Domain (if configured)
R2_CUSTOM_DOMAIN=cdn.cruisemadeeasy.com
```

### **CDN Configuration**
```bash
# CDN Base URLs
CDN_BASE_URL=https://cdn.cruisemadeeasy.com
BLOG_CSS_BASE_URL=https://cdn.cruisemadeeasy.com/blog-css

# Cloudflare Zone (for Image Resizing)
CLOUDFLARE_ZONE_ID=your_zone_id_for_cruisemadeeasy_com
```

### **Image Processing Configuration**
```bash
# Cloudflare Image Resizing (automatic with Zone)
# No additional config needed - uses /cdn-cgi/image/ URLs
IMAGE_RESIZE_ENABLED=true

# Image storage paths
IMAGE_STORAGE_PATH=blog-images
IMAGE_MAX_SIZE_MB=10
```

### **Development Configuration**
```bash
# Local development (production mode)
LOCAL_DEV_PORT=8787
VITE_DEV_PORT=5174

# CORS origins for development
CORS_ORIGINS=https://blog.cruisemadeeasy.com,https://cme-content-worker.ksstorm.workers.dev,http://localhost:5174
```

## Wrangler Configuration

### **wrangler.toml Updates Required**
```toml
name = "cme-content-worker"
main = "src/worker/index.ts"
compatibility_date = "2024-09-01"

[env.production]
# D1 Database binding
[[env.production.d1_databases]]
binding = "DB"
database_name = "cme-content-worker-db" 
database_id = "58de4dc4-0900-4b28-9ccc-5d066557bb11"

# R2 Storage binding
[[env.production.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "cruisemadeeasy-images"

# Environment variables
[env.production.vars]
ENVIRONMENT = "production"
CDN_BASE_URL = "https://cdn.cruisemadeeasy.com"
BLOG_CSS_BASE_URL = "https://cdn.cruisemadeeasy.com/blog-css"
CORS_ORIGINS = "https://blog.cruisemadeeasy.com,https://cme-content-worker.ksstorm.workers.dev"
```

## Local Development Setup

### **Development Environment (Production Mode)**
```bash
# 1. Install dependencies
npm install

# 2. Configure Wrangler authentication
wrangler auth login

# 3. Verify D1 database connection
wrangler d1 execute cme-content-worker-db --command="SELECT 1"

# 4. Verify R2 bucket access  
wrangler r2 bucket list

# 5. Start development in production mode
npm run dev:worker  # Background session - production Worker locally
npm run dev:frontend  # Background session - Vite for admin only

# 6. Test connections
curl http://localhost:8787/api/health
curl http://localhost:5174/admin  # Admin interface only
```

### **Production Deployment**
```bash
# 1. Build templates into Worker bundle
npm run build:templates

# 2. Build React admin interface
npm run build:frontend  

# 3. Deploy Worker with assets
npm run deploy

# 4. Verify deployment
curl https://cme-content-worker.ksstorm.workers.dev/api/health
```

## Security Configuration

### **API Keys and Secrets**
```bash
# Store in Cloudflare Worker secrets (NOT in wrangler.toml)
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
wrangler secret put CLOUDFLARE_API_TOKEN

# JWT secret for authentication
wrangler secret put JWT_SECRET
```

### **CORS Configuration**
```bash
# Allowed origins (restrictive for production)
CORS_ORIGINS=https://blog.cruisemadeeasy.com,https://cme-content-worker.ksstorm.workers.dev

# Admin authentication
ADMIN_COOKIE_DOMAIN=.cruisemadeeasy.com
ADMIN_COOKIE_SECURE=true
```

## Database Schema Deployment

### **Required Migrations**
```bash
# 1. Apply existing schema
wrangler d1 migrations apply cme-content-worker-db

# 2. Add images table for R2 integration
wrangler d1 execute cme-content-worker-db --file=migrations/add-images-table.sql

# 3. Update posts table for featured images  
wrangler d1 execute cme-content-worker-db --file=migrations/add-featured-image-fk.sql

# 4. Verify schema
wrangler d1 execute cme-content-worker-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### **Images Table Migration**
```sql
-- migrations/add-images-table.sql
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  upload_user_id INTEGER,
  variants_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (upload_user_id) REFERENCES users(id)
);

-- migrations/add-featured-image-fk.sql  
ALTER TABLE posts ADD COLUMN featured_image_id TEXT;
-- Note: SQLite doesn't support ADD FOREIGN KEY, will enforce in application
```

## CDN Configuration

### **CSS File Upload to CDN**
```bash
# CSS files already uploaded to cdn.cruisemadeeasy.com/blog-css/ ✅
# Total: 21 files (13 minified + 8 component CSS files)

# Verify CSS accessibility and caching
curl -I https://cdn.cruisemadeeasy.com/blog-css/core-blocks.min.css
curl -I https://cdn.cruisemadeeasy.com/blog-css/theme-main.min.css
curl -I https://cdn.cruisemadeeasy.com/blog-css/plugin-generateblocks.min.css

# Expected headers:
# Cache-Control: public, max-age=31536000, immutable
# Content-Type: text/css
# Content-Encoding: gzip or br
```

### **Image Resizing Configuration**
```bash
# Cloudflare Image Resizing (automatic with paid plan)
# Test image resizing works:
# Upload test image to R2: blog-images/test.jpg
# Verify resize URLs work:
curl -I https://cdn.cruisemadeeasy.com/blog-images/test.jpg/cdn-cgi/image/width=150,height=150
```

## Validation Checklist

### **Pre-Development Validation**
- [ ] Cloudflare account has Worker and R2 access
- [ ] D1 database accessible and schema applied
- [ ] R2 bucket created and accessible
- [ ] CDN domain configured and CSS files uploaded
- [ ] Image Resizing enabled and working
- [ ] Local development runs in production mode

### **Pre-Deployment Validation**  
- [ ] All environment variables configured
- [ ] Templates compile successfully at build time
- [ ] React admin build completes without errors
- [ ] Database migrations applied successfully
- [ ] R2 image upload/resize workflow tested
- [ ] Template rendering produces valid HTML

### **Post-Deployment Validation**
- [ ] Homepage renders correctly with template system
- [ ] Admin interface accessible and functional
- [ ] Image upload and variants generation working
- [ ] SEO metadata complete in rendered pages
- [ ] Performance targets met (<2s page load)

## Troubleshooting

### **Common Issues**

**Worker deployment fails**:
```bash
# Check Wrangler authentication
wrangler whoami

# Verify account ID and permissions
wrangler account list
```

**Database connection fails**:
```bash
# Test D1 binding
wrangler d1 execute cme-content-worker-db --command="SELECT 1"

# Check database ID matches wrangler.toml
```

**R2 image upload fails**:
```bash
# Test R2 bucket access
wrangler r2 bucket list
wrangler r2 object list cruisemadeeasy-images

# Verify R2 credentials in Worker secrets
```

**Template rendering errors**:
```bash  
# Check Worker logs
wrangler tail

# Test template compilation locally
npm run build:templates
```

**CSS not loading from CDN**:
```bash
# Verify CDN URLs
curl -I https://cdn.cruisemadeeasy.com/blog-css/core-blocks.min.css

# Check CORS headers if needed
```

---

**CRITICAL**: Complete this entire checklist before beginning implementation to avoid environment-related issues during development.