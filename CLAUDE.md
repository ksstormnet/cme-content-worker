# CLAUDE.md - CME Content Worker

**PROJECT CONTEXT**: Cruise Made Easy Content Worker - Advanced content generation and management system for cruise-related content.

## Authorized Directories

**Read/Write Access**:
- `/data/Development/repo/Cruise-Made-Easy/cme-content-worker` (main project directory)
- `/data/Development/repo/Cruise-Made-Easy/cme-posts-abstraction/templates` (original CSS/HTML templates and build scripts for CDN upload)

## Mandatory Subagent Requirements

**CRITICAL ENFORCEMENT**: All work in this repository MUST utilize available subagents for comprehensive workflow management and code quality:

### Available Subagents

#### 1. **fullstack-developer**
- **Purpose**: End-to-end feature owner with expertise across the entire stack
- **Usage**: MANDATORY for all backend development, API design, database integration, and full-stack feature implementation
- **Capabilities**: Complete solutions from database to UI with focus on seamless integration and optimal user experience
- **Tools**: Read, Write, MultiEdit, Bash, Docker, database, redis, postgresql, magic, context7, playwright

#### 2. **ui-designer** 
- **Purpose**: Expert visual designer specializing in creating intuitive, beautiful, and accessible user interfaces
- **Usage**: MANDATORY for all UI development, design systems, and user experience work
- **Capabilities**: Masters design systems, interaction patterns, and visual hierarchy to craft exceptional user experiences that balance aesthetics with functionality
- **Tools**: Read, Write, MultiEdit, Bash, figma, sketch, adobe-xd, framer, design-system, color-theory

#### 3. **agent-organizer**
- **Purpose**: Expert agent organizer specializing in multi-agent orchestration, team assembly, and workflow optimization
- **Usage**: MANDATORY for all complex multi-step tasks, project coordination, and workflow management
- **Capabilities**: Masters task decomposition, agent selection, and coordination strategies with focus on achieving optimal team performance and resource utilization
- **Tools**: Read, Write, agent-registry, task-queue, monitoring

#### 4. **context-manager**
- **Purpose**: Expert context manager specializing in information storage, retrieval, and synchronization across multi-agent systems
- **Usage**: MANDATORY for all context management, state synchronization, and information consistency tasks
- **Capabilities**: Masters state management, version control, and data lifecycle with focus on ensuring consistency, accessibility, and performance at scale
- **Tools**: Read, Write, redis, elasticsearch, vector-db

#### 5. **general-purpose**
- **Purpose**: General-purpose agent for researching complex questions, searching for code, and executing multi-step tasks autonomously
- **Usage**: Use for research, file searching, and when other specialized agents are not appropriate
- **Capabilities**: Complex research, code searching, multi-step task execution
- **Tools**: All available tools (*)

### Subagent Enforcement Protocol

**Activation Requirements**:
- **agent-organizer**: ALWAYS active for task coordination and workflow management
- **context-manager**: ALWAYS active for context synchronization and state management
- **fullstack-developer**: REQUIRED for backend, API, database, authentication, and integration tasks
- **ui-designer**: REQUIRED for UI, design, interface, UX, visual, component, and accessibility tasks
- **general-purpose**: For research tasks and when specialized agents don't match the need

**Quality Standards**:
- All development work must engage appropriate subagents before implementation
- Multi-agent coordination required for complex features spanning multiple domains
- Context consistency maintained across all workflow stages
- Performance and accessibility standards enforced through specialized expertise

### Challenge Mode Requirements
**CRITICAL ENFORCEMENT**: All interactions MUST operate in challenge mode with skeptical analysis and elimination of platitudes.

**Challenge Mode Protocol**:
- **Question Assumptions**: Challenge all design decisions, implementation choices, and architectural approaches
- **Demand Evidence**: Require concrete justification for technical decisions with measurable outcomes
- **Eliminate Platitudes**: Reject generic responses, require specific, actionable information
- **Skeptical Analysis**: Critically evaluate all code, workflows, and system designs
- **Challenge Responses**: Both user and AI responses must be challenged when lacking substance or specificity
- **Single Question Focus**: When questioning, ask ONE question at a time, explore the answer fully, then proceed to the next question to prevent context drift

**Enforcement Standards**:
- **85% Confidence Threshold**: All recommendations must meet high confidence standards with evidence
- **Specific Over General**: Concrete implementation details required over abstract concepts
- **Measurable Outcomes**: Solutions must include measurable success criteria
- **Evidence-Based Decisions**: All technical choices must be justified with performance, security, or maintainability evidence
- **Critical Review**: Actively challenge and improve all proposed solutions

## Mandatory MCP Server Integration

**CRITICAL REQUIREMENT**: This project MUST utilize the official Cloudflare MCP servers for all Cloudflare service interactions.

### MCP Server Configuration

#### **Setup Complete**
- **MCP Configuration**: `.mcp.json` file configured with Cloudflare MCP servers
- **Remote Access**: `mcp-remote` package installed for server connectivity
- **Auto-Enable**: `enableAllProjectMcpServers: true` in `.claude/settings.local.json`
- **Repository**: Cloudflare MCP server cloned to `mcp-servers/mcp-server-cloudflare/`

### Available MCP Servers

#### **Codebase Intelligence** (MANDATORY Usage)
- **code-understanding** (Local Python-based MCP server)
  - Analyze local codebase structure and dependencies
  - Generate repository maps with function signatures and class definitions  
  - Identify critical files based on complexity metrics
  - Provide intelligent context for AI coding assistance
  - **Usage**: REQUIRED for all codebase analysis, architecture understanding, and complex refactoring tasks

#### **Core Development Servers** (MANDATORY Usage)
- **cloudflare-observability** (`https://observability.mcp.cloudflare.com/sse`)
  - Debug and get insights into Worker logs and analytics
  - **Usage**: REQUIRED for all debugging, monitoring, and performance analysis
  
- **cloudflare-bindings** (`https://bindings.mcp.cloudflare.com/sse`)
  - Build Workers applications with storage, AI, and compute primitives
  - **Usage**: REQUIRED for D1 database and R2 storage management
  
- **cloudflare-browser** (`https://browser.mcp.cloudflare.com/sse`)
  - Fetch web pages, convert to markdown, take screenshots
  - **Usage**: REQUIRED for content preview and template testing

#### **Supporting Servers** (Available)
- **cloudflare-docs** (`https://docs.mcp.cloudflare.com/sse`)
  - Get up-to-date reference information on Cloudflare APIs
  - **Usage**: For API documentation and troubleshooting
  
- **cloudflare-radar** (`https://radar.mcp.cloudflare.com/sse`)
  - Get global Internet traffic insights and trends
  - **Usage**: For analytics and performance insights

### MCP Enforcement Protocol

**Integration Requirements**:
- **Codebase Analysis**: MANDATORY use of code-understanding for all architectural analysis, dependency mapping, and complex refactoring
- **All Cloudflare Operations**: MUST use appropriate MCP servers when available
- **Database Operations**: Use cloudflare-bindings for D1 database management
- **Media Management**: Use cloudflare-bindings for R2 bucket operations  
- **Debugging**: MANDATORY use of cloudflare-observability for Worker debugging
- **Content Testing**: Use cloudflare-browser for template and content validation

**Usage Priority**:
1. **Codebase Intelligence**: FIRST choice for architectural analysis, dependency mapping, and code understanding
2. **MCP Servers**: FIRST choice for all Cloudflare service interactions
3. **Direct APIs**: Only when MCP server capabilities are insufficient
4. **Documentation**: Always reference via cloudflare-docs MCP server

**Authentication Protocol**:
- **OAuth2 Required**: Cloudflare MCP servers require OAuth2 authentication each session
- **Active Account**: ALWAYS set to Sky + Sea, LLC (`54919652c0ba9b83cb0ae04cb5ea90f3`) after authentication
- **Session Setup**: Run `npm run cf:setup` for account configuration instructions
- **Account Selection**: Use `mcp__cloudflare-radar__set_active_account` with Sky + Sea account ID

**Performance Notes**:
- Keep queries concise to avoid context-length limits
- Break complex operations into smaller MCP tool calls
- Some features may require paid Cloudflare Workers plan
- OAuth authentication required once per Claude Code session

## Critical Module System Guardrails

**MANDATORY ES MODULE COMPLIANCE**: This project uses ES modules exclusively. ALL code must follow these patterns to prevent compilation failures.

### **Required Import/Export Patterns**

#### **✅ CORRECT ES Module Syntax (ALWAYS USE)**:
```typescript
// Named imports
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env } from "../types/database";

// Default imports
import templateRenderRoutes from "./routes/template-render";

// Named exports
export const authRoutes = new Hono<{ Bindings: Env }>();
export { someFunction, anotherFunction };

// Default exports
export default function myComponent() { ... }

// Type-only imports/exports
import type { DatabaseRow } from "../types/database";
export type { MyType } from "./types";
```

#### **❌ FORBIDDEN CommonJS Syntax (NEVER USE)**:
```javascript
// These will cause compilation failures:
const hono = require("hono");           // ❌ Use: import { Hono } from "hono"
module.exports = { ... };               // ❌ Use: export { ... } or export default
exports.myFunction = () => {};          // ❌ Use: export const myFunction = () => {}
const template = require("./template"); // ❌ Use: import template from "./template"
```

### **File Extension Requirements**

#### **Required Extensions**:
- **TypeScript files**: `.ts` (Worker, utilities, types)
- **React components**: `.tsx` (JSX components only)
- **Configuration files**: Follow existing patterns in project

#### **Import Path Requirements**:
- **Relative imports**: Must include file extension when importing `.ts/.tsx` files
- **Package imports**: No extension needed for npm packages
- **Type-only imports**: Use `import type` for type imports

```typescript
// ✅ Correct import paths
import { myUtil } from "./utils/my-util.js";        // Note: .js extension for .ts files
import MyComponent from "./components/MyComponent.tsx";
import type { MyType } from "./types/database.js";
```

### **Project-Specific Module Configuration**

#### **package.json Configuration**:
- `"type": "module"` - ES modules enabled
- All scripts and dependencies configured for ES modules

#### **TypeScript Configuration**:
- **Target**: ES2022
- **Module**: ESNext  
- **Module Resolution**: bundler
- **Library**: ES2023

### **Module System Enforcement Protocol**

**Pre-Code Checklist** (MANDATORY before writing any code):
1. ✅ **Verify ES module syntax**: All imports use `import` statements
2. ✅ **Verify exports**: All exports use `export` statements  
3. ✅ **Check file extensions**: Import paths include correct extensions
4. ✅ **Validate TypeScript config**: Ensure compatibility with project settings
5. ✅ **Test compilation**: Always test that new code compiles without module errors

**Error Prevention Rules**:
- **NEVER mix**: CommonJS and ES module syntax in same file
- **ALWAYS use**: `import`/`export` statements exclusively
- **ALWAYS include**: File extensions in relative imports
- **ALWAYS prefer**: Named imports over default imports when both available

## Critical System Requirements

### Database Usage & Timezone
**CRITICAL**: **NEVER** use the local database. For anything.
- **Production Database Only**: All database operations use remote D1 instance
- **No Local Database**: No local database connections or queries permitted
- **Timezone Standard**: All timestamps stored in **America/Chicago** timezone
- **Schema Changes**: All new datetime fields use `datetime('now', 'America/Chicago')`

### Development Server Management
**CRITICAL**: **ALWAYS** run backend and frontend using bash sessions and associated scripts
- Use background bash sessions for all development servers
- Worker development server frequently needs to be killed and restarted with correct port
- At this time, Vite server (`dev:frontend`) is not needed unless explicitly instructed

### Command Syntax
**IMPORTANT**: This computer uses ripgrep - revise all grep commands to use `rg` syntax instead of standard grep.

## Architecture Overview

### **Modern Clean Separation Architecture** 
**Development**: Worker serves ALL routes (blog + admin + API) on `localhost:8787`
**Production**: Worker serves complete site with server-side rendering

### Core Technology Stack
- **Backend**: Cloudflare Workers + Hono.js (TypeScript)
- **Frontend**: React 19.0.0 + React Router 7.1.1 + Vite 6.0.0
- **Database**: Cloudflare D1 SQLite (15+ tables with block-based content, America/Chicago timezone)
- **Storage**: Cloudflare R2 object storage + on-demand Image Resizing
- **CDN**: Cloudflare CDN with Image Resizing Worker for dynamic variants
- **AI Integration**: Multi-model (GPT-3.5, GPT-4o-mini, Claude-3.5-Sonnet)
- **Social Integration**: GoHighLevel webhook/API for social media automation

### Worker Handles Everything
The Cloudflare Worker serves all functionality:

1. **API Routes**: `/api/*` endpoints for all backend functionality
2. **Public Routes**: `/` and all public routes with server-side blog rendering
3. **Remote Services**: D1 database queries and R2 bucket operations
4. **Admin Interface**: React app served on `/admin` and `/blogin` paths

### **Critical File Hierarchy** (Development Priority)
```
CRITICAL (Touch with extreme care):
├── src/worker/index.ts          # Main Hono app + routing
├── src/react-app/App.tsx        # React app root + auth
├── schema.sql                   # D1 database schema (15+ tables)
├── wrangler.json               # Cloudflare Workers config
├── src/utils/block-renderer.ts  # Content rendering engine (462 lines)

ESSENTIAL (Core business logic):
├── src/worker/routes/
│   ├── create.ts               # AI content generation API
│   ├── auth.ts                 # Authentication system
│   ├── template-render.ts      # Server-side blog rendering
│   └── media.ts               # R2 media management
├── src/react-app/components/
│   ├── CreateDashboard.tsx     # Main admin interface
│   ├── ContentGenerator.tsx    # AI content creation UI
│   └── BlogWithFilters.tsx     # Public blog display
├── build/template-compiler.js   # Build-time template compilation
├── /data/Development/repo/Cruise-Made-Easy/cme-posts-abstraction/templates/
│   ├── build-minified-css.js    # CSS minification build script
│   ├── page-frame.html          # Main page template (references CDN CSS)
│   ├── component-*.css          # Component stylesheets (source)
│   ├── component-*.min.css      # Minified CSS (generated for CDN)
│   └── core-variables.min.css   # Minified core variables
```

### **Core Workflows** (Understanding Data Flow)

#### **Content Generation Workflow**
1. **User Input** → Content Generator UI (`ContentGenerator.tsx`)
2. **AI Processing** → Multi-model API calls (`/api/create/*` routes)  
3. **Block Structure** → JSON content blocks (`block-renderer.ts`)
4. **Database Storage** → D1 SQLite with audit trail (`posts` + `content_blocks` tables)
5. **Server Rendering** → Template system with variables (`template-render.ts`)
6. **CDN Delivery** → Static assets via R2 + Cloudflare

#### **Authentication & Session Flow**
- **Cookie-based Sessions** → HTTP-only security (`auth.ts`)
- **Role-based Access** → Admin/Editor/Viewer levels
- **API Protection** → Middleware validation across all routes

#### **Media Management Flow** 
- **Upload** → R2 bucket storage (`media.ts` API)
- **Processing** → Image variants and optimization
- **Delivery** → CDN-optimized URLs via asset resolver

### Template System Integration

**Template Assets**:
- Original templates and CSS located in `/data/Development/repo/Cruise-Made-Easy/cme-posts-abstraction/templates`
- Templates are on CDN and should be referenced by CDN URL in worker code
- Some template functionality has been integrated into React components for `/` route and category listings

**Page Assembly Process**:
1. Templates assembled into complete page structure
2. React app mounted in main content area of the page
3. **Current Issue**: Inconsistent mounting behavior between `localhost:8787` and `tips.cruisemadeeasy.com` (production)
4. **Status**: Mostly solved, but needs review for consistency

## Development Environment Architecture

### **MANDATORY Background Session Management**
**CRITICAL REQUIREMENT**: Worker development server MUST run in background bash session controlled by Claude to prevent session hijacking.

**Background Session Protocol**:
- **Single Session**: Worker development server serves ALL routes (blog + admin + API) on `localhost:8787`
- **Command**: `npm run dev:worker` (run in background bash session using Bash tool with `run_in_background: true`)
- **Agent Orchestration**: Use agent-organizer for coordinating session management and routing
- **Never Foreground**: Development server must NEVER run in foreground Claude session

**Architecture Summary**:
- **Development Mode**: Worker serves ALL routes on `localhost:8787`
- **Production Mode**: Worker serves everything on `tips.cruisemadeeasy.com`
- **NO Separate Vite Server**: Vite is only used for building, not serving in development

### CSS & Template Build System

**Template Source Management**:
- **Source Location**: `/data/Development/repo/Cruise-Made-Easy/cme-posts-abstraction/templates/`
- **Build Script**: `build-minified-css.js` - Generates minified CSS only when source files change
- **CDN Integration**: Both unminified and minified CSS files uploaded to CDN
- **Template References**: HTML templates reference minified CSS files via CDN URLs

**CSS Minification Workflow**:
1. **Edit CSS**: Modify unminified CSS files in `/templates/` directory
2. **Build Templates**: Run `npm run build:templates` (triggers CSS minification at source)
3. **Upload to CDN**: Upload both unminified and minified CSS files to R2
4. **Template Loading**: HTML templates automatically load minified CSS from CDN

**CSS Minification Command**:
```bash
# Manual CSS minification at template source
cd /data/Development/repo/Cruise-Made-Easy/cme-posts-abstraction/templates
node build-minified-css.js

# Integrated into template build
npm run build:templates  # Triggers CSS minification + template compilation
```

### Development Commands & Workflows

**Session Setup Protocol**:
```bash
# MANDATORY: Start background session using Claude Bash tool
npm run dev:worker    # Background: true (serves ALL routes on :8787)
```

**Development & Deployment**:
```bash
# Database management
npx wrangler d1 migrations list              # List migrations
npx wrangler d1 migrations apply             # Apply pending migrations
npx wrangler d1 execute --command="SELECT * FROM posts"  # Direct SQL

# Build & deployment
npm run build                 # Build React app + Worker for production
npm run deploy               # Deploy Worker to Cloudflare with assets
npm run check                # Full build validation + deployment dry-run

# Development utilities
npm run lint                 # ESLint code quality
npm run cf-typegen           # Generate Cloudflare Worker types
```

### Production Environment
- **Production URL**: `tips.cruisemadeeasy.com`
- **Same Architecture**: Worker handles all routes and functionality
- **CDN Assets**: CSS and media files served from Cloudflare R2 CDN
- **Template Consistency**: HTML templates reference same minified CSS files via CDN

## Database Connection Details

### D1 Database Configuration
- **Database ID**: `58de4dc4-0900-4b28-9ccc-5d066557bb11`
- **Platform**: Cloudflare D1 SQLite (Edge Database)
- **Schema File**: `schema.sql`
- **Access Commands**:
  ```bash
  # List migrations
  npx wrangler d1 migrations list
  
  # Apply pending migrations
  npx wrangler d1 migrations apply
  
  # Execute direct SQL queries
  npx wrangler d1 execute --command="[SQL_QUERY]"
  
  # Access database for analysis
  npx wrangler d1 execute --command="SELECT name FROM sqlite_master WHERE type='table'"
  ```

## Development Standards

### Mandatory Git Flow Protocol
**CRITICAL ENFORCEMENT**: All code development MUST follow this git flow protocol:

#### Branch Management
- **NEVER edit code directly on `main` branch** - main is read-only for deployment
- **Always branch from `dev`** for all feature work
- **Branch naming**: Use descriptive names (e.g., `feature/user-auth`, `fix/redis-connection`, `enhance/cruise-search`)
- **One feature per branch** - keep changes focused and atomic

#### Development Workflow
1. **Branch Creation**: `git checkout dev && git pull origin dev && git checkout -b feature/descriptive-name`
2. **Code Development**: Write code with appropriate testing considerations
3. **Immediate Commit**: Commit code AS SOON as written, BEFORE any testing
4. **Lint on Commit**: Always run appropriate linting (npm run lint, composer lint, etc.) during commit process
5. **Test After Commit**: Run tests after committing to verify functionality

#### Project Completion Protocol
When project is declared complete:
1. **Merge to Dev**: `git checkout dev && git merge feature/branch-name`
2. **Local Cleanup**: `git branch -d feature/branch-name`
3. **Remote Push**: `git push origin dev`
4. **PR Generation**: If remote requires PR for main, use `gh pr create` with appropriate title and description
5. **Follow Restrictions**: Respect any branch protection rules or review requirements

#### Repository-Specific Linting
- **Node.js Projects**: Use ESLint with project-specific configuration
- **TypeScript**: Use typescript-eslint for type safety
- **Documentation**: Use markdownlint for consistency

## Authentication & Security System

### Authentication Architecture
- **Protocol**: JWT-based authentication with HTTP-only cookies
- **Implementation**: `src/worker/routes/auth.ts` (209 lines)
- **Middleware**: `requireAuth` middleware for protected routes
- **Session Duration**: 24 hours with automatic expiration

### Security Implementation

#### **Password Security**
```typescript
// Development-grade hashing (SHA-256 + static salt)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
};
```
**Security Note**: Uses SHA-256 + static salt (development-grade). Production should use bcrypt with dynamic salts.

#### **JWT Token Management**
```typescript
// JWT payload structure
const payload = {
  user_id: user.id,
  email: user.email,
  role: user.role,
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
};
```

**Token Security**:
- **Storage**: HTTP-only cookies (prevents XSS)
- **Expiration**: 24-hour automatic expiration
- **Verification**: Server-side JWT verification on every request
- **Protocol Detection**: Secure flag based on HTTPS detection

#### **Cookie Configuration**
```typescript
setCookie(c, "auth_token", token, {
  httpOnly: true,           // Prevents JavaScript access
  secure: isHttps,          // HTTPS-only in production
  sameSite: "Lax",         // CSRF protection
  maxAge: 24 * 60 * 60,    // 24 hours
  path: "/",               // Site-wide access
});
```

### Role-Based Access Control

#### **User Roles**
- **admin**: Full system access (user management, all content operations)
- **editor**: Content creation and editing (limited user operations)
- **viewer**: Read-only access (no content modification)

#### **Role Enforcement**
- **Database Level**: Role stored in `users.role` column
- **Middleware Level**: `requireAuth` validates user existence and active status
- **API Level**: Individual routes can check role permissions
- **Frontend Level**: UI elements conditionally rendered based on role

### Authentication Endpoints

#### **POST /api/auth/login**
- **Input**: `{ email, password }`
- **Process**: Email lookup → Password verification → JWT creation → Cookie setting
- **Output**: User profile data (excluding password)
- **Security**: Login attempt tracking, credential validation

#### **POST /api/auth/logout**
- **Process**: Cookie deletion via `deleteCookie`
- **Security**: Immediate session termination

#### **GET /api/auth/me**
- **Middleware**: `requireAuth` required
- **Output**: Current user profile data
- **Use Case**: Session validation, profile display

#### **POST /api/auth/change-password**
- **Input**: `{ current_password, new_password }`
- **Process**: Current password verification → New password hashing → Database update
- **Security**: Requires valid session + current password verification

### Security Middleware Flow

#### **requireAuth Middleware**
```typescript
1. Extract auth_token from cookies
2. Verify JWT signature and expiration
3. Look up user in database (active users only)
4. Attach user object to request context
5. Allow request to proceed OR return 401
```

**Error Handling**:
- Missing token → 401 "Not authenticated"
- Expired token → 401 "Token expired"  
- Invalid token → 401 "Invalid token"
- User not found/inactive → 401 "User not found"

### Session Management

#### **Session Lifecycle**
1. **Login**: JWT created → HTTP-only cookie set → 24-hour expiration
2. **Request**: Cookie extracted → JWT verified → User validated → Request allowed
3. **Logout**: Cookie deleted → Session terminated immediately
4. **Expiration**: Automatic expiration after 24 hours

#### **Security Considerations**
- **XSS Protection**: HTTP-only cookies prevent JavaScript access
- **CSRF Protection**: SameSite=Lax cookie configuration
- **Transport Security**: Secure flag for HTTPS connections
- **Session Hijacking**: JWT expiration limits exposure window

### Database Integration

#### **User Validation Queries**
```sql
-- Login user lookup
SELECT * FROM users WHERE email = ? AND active = 1

-- Session user validation  
SELECT * FROM users WHERE id = ? AND active = 1

-- Login tracking
UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
```

### Development vs Production Security

#### **Current Implementation** (Development-Appropriate)
- SHA-256 + static salt password hashing
- Protocol-based secure cookie detection
- 24-hour JWT expiration
- Basic role-based access control

#### **Production Recommendations**
- Implement bcrypt with dynamic salts
- Add rate limiting for login attempts
- Implement refresh token rotation
- Add multi-factor authentication option
- Implement session invalidation on password change
- Add audit logging for authentication events

## CDN & Asset Management

### Current CDN Upload Process (Manual)

**R2 Bucket Configuration**:
- **Bucket Name**: `cruisemadeeasy-images`
- **CDN URL**: `https://cdn.cruisemadeeasy.com`
- **Management**: Cloudflare Dashboard interface

**CSS Asset Upload Workflow**:
1. **Generate Minified CSS**: Run template CSS build script
   ```bash
   cd /data/Development/repo/Cruise-Made-Easy/cme-posts-abstraction/templates
   node build-minified-css.js
   ```
2. **Manual Upload**: Drag and drop CSS files from local filesystem to Cloudflare R2 interface
3. **Upload Both Versions**: Upload both unminified and minified CSS files
4. **CDN Path Structure**: Files available at `https://cdn.cruisemadeeasy.com/blog-css/[filename]`

**Media Asset Strategy**:
- **Single Storage**: Store only one version of each image in R2
- **Dynamic Resizing**: Use Cloudflare Image Resizing Worker for all variants
- **On-Demand Processing**: Generate sizes as needed (no pre-generated variants)
- **Categorization**: Images organized by `image_type` (featured, content, social, thumbnail) and `category` (for tree display)
- **Social Media Integration**: Properly-resized versions delivered on-demand for each platform

### Template CDN Integration

**Template CSS References**:
```html
<!-- Templates reference minified CSS from CDN -->
<link rel="stylesheet" href="https://cdn.cruisemadeeasy.com/blog-css/component-header.min.css">
<link rel="stylesheet" href="https://cdn.cruisemadeeasy.com/blog-css/core-variables.min.css">
```

**Asset Management Flow**:
1. **Template Development**: Edit CSS in `/templates/` directory
2. **CSS Minification**: Auto-generated minified versions when files change
3. **Manual CDN Upload**: Drag-and-drop to R2 via Cloudflare interface
4. **Template Loading**: HTML templates reference CDN URLs for assets

### Image Resizing Architecture

**Cloudflare Image Resizing Integration**:
- **Single Source**: Store original images only in R2 bucket
- **Dynamic Variants**: Generate resized images on-demand via Cloudflare Image Resizing
- **URL Pattern**: `https://cdn.cruisemadeeasy.com/cdn-cgi/image/width=300,height=200/[image-path]`
- **Social Media Optimization**: Automatic sizing for Facebook, Instagram, LinkedIn, Twitter, Pinterest
- **Performance**: CDN caching of resized variants for optimal delivery

**Media Management Workflow**:
1. **Upload**: Single original image to R2 bucket
2. **Categorization**: Tag with `image_type` and `category` for organization
3. **Social Assignment**: Link images to social media posts via `social_media_images` table
4. **Dynamic Delivery**: Request specific sizes via Image Resizing Worker parameters

**Future R2 Management Automation**:
- **Programmatic Upload**: Automated R2 upload via Wrangler CLI or API
- **Asset Versioning**: Version control for CSS and media assets
- **Bulk Operations**: Batch upload and management capabilities
- **Social Media Integration**: Automated resizing for GoHighLevel webhook delivery

## Social Media Integration Architecture

### GoHighLevel Integration Workflow

**Integration Overview**:
- **Platform**: GoHighLevel (GHL) via webhook/API
- **Trigger**: Post scheduling confirmation in CME Content Worker
- **Purpose**: Automated social media posting around blog post release time
- **Content Format**: Platform-specific excerpts with properly-sized images

**Social Media Excerpt System**:
```typescript
interface PostSocialExcerpts {
  // Facebook (3 options for flexibility)
  social_facebook_1: string;
  social_facebook_2: string;
  social_facebook_3: string;
  
  // Platform-specific excerpts
  social_linkedin: string;
  social_instagram: string;
  social_twitter: string;
  social_pinterest: string;
}
```

**Image Assignment Workflow**:
1. **Post Creation**: User creates blog post with multiple images
2. **Excerpt Generation**: AI pre-generates social media excerpts for all platforms
3. **User Confirmation**: Before scheduling, user reviews and confirms social excerpts
4. **Image Assignment**: User assigns available post images to each social platform
5. **Size Optimization**: System delivers properly-resized images per platform requirements
6. **GoHighLevel Delivery**: Webhook sends formatted content with UTM-enabled links

### Social Media Image Relations

**Database Structure**:
```sql
CREATE TABLE social_media_images (
  post_id INTEGER, -- Links to posts.id
  platform TEXT,   -- facebook_1, facebook_2, facebook_3, linkedin, instagram, twitter, pinterest
  image_id TEXT,   -- Links to images.id
  image_order INTEGER -- For multiple images per platform
);
```

**Platform Image Requirements** (Auto-delivered via Cloudflare Image Resizing):
- **Facebook**: 1200x630px (1.91:1 ratio)
- **LinkedIn**: 1200x627px (1.91:1 ratio)  
- **Instagram**: 1080x1080px (1:1 ratio)
- **Twitter**: 1200x675px (16:9 ratio)
- **Pinterest**: 735x1102px (2:3 ratio)

### UTM Parameter Integration

**Numeric Post ID System**:
- **Field**: `posts.post_id` (numeric, starts at 1000)
- **Usage**: UTM parameters for social media links
- **Format**: `utm_source=social&utm_medium=facebook&utm_campaign=post_1234`
- **GoHighLevel Integration**: Uses numeric ID for campaign tracking

**URL Structure for Social Posts**:
```
https://tips.cruisemadeeasy.com/[category]/[slug]/?utm_source=social&utm_medium=[platform]&utm_campaign=post_[post_id]
```

### Content Workflow Integration

**Post Scheduling Process** (Enhanced):
1. **Content Creation**: User creates blog post content
2. **AI Generation**: System pre-generates social excerpts
3. **Image Selection**: User assigns images to social platforms
4. **Excerpt Review**: User confirms/edits social media text
5. **Scheduling**: User schedules blog post publication
6. **GoHighLevel Webhook**: System sends formatted social content to GHL
7. **Social Automation**: GHL schedules social posts around blog release

**Media Management Enhancement**:
- **Image Categorization**: `image_type` (featured, content, social) + `category` (for tree display)
- **Media Library**: Tree-based browsing with category folders
- **Social Assignment**: Visual interface for assigning images to platforms
- **Size Preview**: Real-time preview of resized images for each platform

### Content Brief Workflow

**AI-Generated Content Briefs**:
```sql
CREATE TABLE content_briefs (
  calendar_id INTEGER,
  content_brief TEXT, -- Markdown format
  completed_at DATETIME, -- When AI generation completed and approved
  -- ... other fields
);
```

**Brief Generation Workflow**:
1. **AI Generation**: System generates content brief from calendar themes
2. **User Review**: User reviews generated brief in markdown editor
3. **Brief Editing**: User can edit brief using simple markdown editor interface
4. **Completion Tracking**: `completed_at` timestamp marks when brief is approved
5. **Content Creation**: Brief guides actual blog post creation process

**Year-Week Planning**:
- **Format**: `content_calendar.year_week` field (e.g., "2025-46")
- **Calculation**: Based on Monday date of the week
- **Integration**: Links content planning to social media calendar

---

**Current Status**: Enhanced architecture with social media integration, GoHighLevel webhook support, production-ready security, and comprehensive media management system.