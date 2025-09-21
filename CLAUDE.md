# CLAUDE.md - CME Content Worker

**PROJECT CONTEXT**: Cruise Made Easy Content Worker - Advanced content generation and management system for cruise-related content.

## Mandatory Agent Requirements

**CRITICAL ENFORCEMENT**: All work in this repository MUST utilize these four specialized agents from the VoltAgent awesome-claude-code-subagents collection:

### Required Agents (Auto-loaded from `.claude/agents/`)

#### 1. **fullstack-developer** (`.claude/agents/fullstack-developer.md`)
- **Implementation**: Reference specification for comprehensive full-stack development patterns
- **Usage**: Manual adherence to guidelines during backend, frontend, API, database, and authentication tasks
- **Capabilities**: Complete stack integration, database-to-UI solutions, cross-layer consistency
- **Tools**: Read, Write, MultiEdit, Bash, Docker, database, redis, postgresql, magic, context7, playwright

#### 2. **ui-designer** (`.claude/agents/ui-designer.md`)  
- **Implementation**: Reference specification for professional UI/UX design patterns
- **Usage**: Manual adherence during UI, design, interface, UX, visual, component, styling, and responsive tasks
- **Capabilities**: Visual design, interaction design, design systems, accessibility standards (WCAG 2.1 AA)
- **Tools**: Design system tools, atomic design methodology, responsive design principles

#### 3. **agent-organizer** (`.claude/agents/agent-organizer.md`)
- **Implementation**: Reference specification for multi-agent coordination patterns
- **Usage**: Manual adherence during multi-step, complex, coordination, workflow, planning, and orchestration tasks
- **Capabilities**: Task decomposition, agent coordination, workflow optimization, team assembly
- **Performance Targets**: >95% agent selection accuracy, >99% task completion rate, <5s response time

#### 4. **context-manager** (`.claude/agents/context-manager.md`)
- **Implementation**: Reference specification for context and state management patterns
- **Usage**: Manual adherence during context, state, memory, storage, persistence, sync, and data management tasks
- **Capabilities**: Information storage/retrieval, state management, version control, data lifecycle management
- **Performance Targets**: <100ms retrieval times, 100% data consistency, 99.9% availability

## Agent Configuration

### Configuration Files
- **Agent Definitions**: `.claude/agents/*.md` (VoltAgent specifications)
- **Agent Policies**: `.claude/agent-config.json` (enforcement rules and triggers)
- **Claude Settings**: `.claude/settings.local.json` (permissions and MCP configuration)

### Enforcement Policy
```json
{
  "enforcement": {
    "strict_mode": true,
    "parallel_execution": true, 
    "context_sharing": true,
    "failure_mode": "block"
  }
}
```

**AGENT IMPLEMENTATION PROTOCOL**:

#### How Agents Actually Work
**IMPORTANT**: These agents are **reference specifications**, not integrated Claude Code subagents. Claude Code's Task tool only supports: `general-purpose`, `statusline-setup`, `output-style-setup`.

#### Manual Agent Implementation
1. **Specification Reference**: Consult `.claude/agents/*.md` files for detailed behavioral guidelines
2. **Pattern Adherence**: Follow agent-specific workflows and quality standards manually
3. **Task-Specific Usage**: Apply appropriate agent patterns based on work type
4. **General-Purpose Integration**: Use Task tool with `general-purpose` agent + agent-specific prompts when needed

#### Agent Activation Strategy
**Always Active Agents**:
- **agent-organizer**: Always active for task coordination and workflow management
- **context-manager**: Always active for context synchronization and state management

**Trigger-Based Agents**:
- **fullstack-developer**: Activates for backend, frontend, database, API, authentication, and full-stack development tasks
- **ui-designer**: Activates for UI, design, interface, UX, visual, component, styling, and responsive design tasks

**Agent Usage Protocol**:
1. **agent-organizer + context-manager**: Always engaged for coordination and context management
2. **fullstack-developer**: Triggers on development tasks, follows comprehensive stack integration patterns
3. **ui-designer**: Triggers on design tasks, follows professional UI/UX design standards

#### Future Integration Options
- **MCP Server Development**: Custom MCP server could integrate agents as callable tools
- **Manual Reference**: Current approach using specifications as detailed guidelines
- **Enhanced Prompting**: Leverage agent specifications in Task tool prompts

## Modernized Architecture (January 2025)

### Architecture Transformation
This project has undergone a comprehensive modernization to implement clean development/production routing separation:

**BEFORE**: Hybrid routing with Worker serving blog content + Vite serving admin (confusing, session hijacking)
**AFTER**: Clean separation - Vite serves ALL routes in development, Worker serves everything in production

### Current Architecture Benefits
- **No Session Hijacking**: Background sessions prevent Claude session blocking
- **Clean Development**: Single server (Vite) handles all routes with React Router
- **True Production**: Worker serves complete site with server-side rendering
- **API Consistency**: Same API endpoints work in both environments
- **Hot Module Replacement**: Full React development experience maintained

## Project Architecture

### Technology Stack
- **Backend**: Cloudflare Workers with Hono.js framework, TypeScript runtime
- **Frontend**: React 19.0.0 with TypeScript, Vite 6.0.0 build system
- **Database**: Cloudflare D1 SQLite (edge computing database)
- **Storage**: Cloudflare R2 object storage for media assets
- **Authentication**: Cookie-based sessions with role management (admin/editor/viewer)
- **AI Integration**: Multi-model support (GPT-3.5, GPT-4o-mini, Claude-3.5-Sonnet)
- **Deployment**: Cloudflare Workers platform with edge computing

### Development Environment Architecture

#### **MANDATORY BACKGROUND SESSION MANAGEMENT**
**CRITICAL REQUIREMENT**: All development servers MUST run in background bash sessions controlled by Claude to prevent session hijacking.

**Background Session Protocol**:
- **Session 1**: Vite development server (serves ALL routes in development)
- **Session 2**: Worker API server (serves ONLY `/api/*` endpoints in development)  
- **Agent Orchestration**: Use agent-organizer for coordinating session management and routing
- **Never Foreground**: Development servers must NEVER run in foreground Claude session

**Architecture Summary**:
- **Development Mode**: Vite serves everything (frontend + admin + blog content via React Router), Worker serves only API
- **Production Mode**: Worker serves everything (static React build + dynamic blog content + API routes)
- **Build-Time Routing**: Conditional routing logic based on environment

**Development Setup Requirements** (MANDATORY Background Sessions):
1. **Session 1 - Vite Dev Server**: Serves ALL routes on `localhost:5174` (frontend, admin, blog content)
   - Command: `npm run dev:frontend` (run in background bash session)
   - Handles all routing via React Router
   - Proxies `/api/*` requests to Worker server
2. **Session 2 - Worker Dev Server**: Serves ONLY `/api/*` routes on `localhost:8787` 
   - Command: `npm run dev:worker` (run in background bash session) 
   - API-only mode in development environment
   - Redirects blog routes to Vite in development
3. **Database Configuration**: Worker uses REMOTE D1 instance (production binding)
4. **Database ID**: `58de4dc4-0900-4b28-9ccc-5d066557bb11`
5. **R2 Bucket**: `cruisemadeeasy-images` (remote production binding)
6. **Background Session Management**: Both servers MUST run in Claude-controlled background sessions

#### Development vs Production Routing
**Development Routing**:
```
Vite (localhost:5174):
├── / (React Router - fetches blog data via API)
├── /admin/* (React Router - admin interface)
├── /category/* (React Router - fetches category data via API)
├── /:category/:slug (React Router - fetches post data via API)
└── /api/* → Proxied to Worker

Worker (localhost:8787):
└── /api/* (API endpoints only)
```

**Production Routing**:
```
Worker (blog.cruisemadeeasy.com):
├── / (Server-rendered blog homepage)
├── /category/* (Server-rendered category pages)
├── /:category/:slug (Server-rendered post pages)
├── /admin/* (Serves React build files)
├── /assets/* (Static React assets)
└── /api/* (API endpoints)
```

### Database Schema (Advanced Block-Based Architecture)

#### Core Tables Structure
```sql
-- User management with role-based access
users (id, email, password_hash, salt, role, created_at, updated_at)

-- Main content with structured content blocks
posts (id, title, slug, status, user_id, persona, post_type, created_at, updated_at)

-- Granular content components
content_blocks (id, post_id, type, content, sort_order, created_at, updated_at)

-- 52-week content planning system
content_calendar (id, week_number, year, theme_primary, theme_secondary, status, created_at)

-- Detailed content briefs and themes
weekly_content_plans (id, week_number, year, content_brief, themes, milestones, created_at)

-- Complete AI generation audit trail
ai_generations (id, user_id, prompt, response, model_used, tokens_used, cost, created_at)

-- System configuration
settings (id, key, value, updated_at)
```

#### Content Block Architecture
**Structured Content Blocks**:
- `heading`: Title elements with H1-H6 levels
- `paragraph`: Rich text content with formatting
- `image`: Media with alt text, captions, and R2 URLs
- `accent_tip`: Highlighted information boxes
- `quote`: Blockquotes with attribution
- `cta`: Call-to-action buttons with tracking
- `divider`: Visual content separators
- `list`: Ordered/unordered lists with nested items
- `table`: Structured data presentation

**Block Storage Format**:
```json
{
  "type": "paragraph",
  "content": {
    "text": "Rich text content",
    "formatting": {...},
    "metadata": {...}
  },
  "sort_order": 1
}
```

### AI-Powered Content Generation System

#### Multi-Model Strategy with Cost Optimization
```typescript
const AI_MODELS = {
  cheap: "gpt-3.5-turbo",        // $0.0005/1K tokens
  standard: "gpt-4o-mini",       // $0.0015/1K tokens  
  premium: "claude-3.5-sonnet",  // $0.003/1K tokens
  fallback: "gpt-3.5-turbo"      // Error recovery
}
```

#### CME-Specific Content Generation
**Brand Guidelines Integration**:
- **Norwegian Cruise Line**: Consistent brand naming (never "NCL")
- **First-Person Storytelling**: Agent perspective throughout
- **Persona Targeting**: Easy Breezy, Thrill Seeker, Luxe Seafarer
- **Post Type Specialization**: Monday/Wednesday/Friday/Saturday/Newsletter content
- **SEO Optimization**: Keywords, meta descriptions, structured content

**Content Generation Workflow**:
1. **Context Assembly**: Weekly themes + persona + post type + detailed prompts
2. **AI Processing**: Multi-model generation with token tracking
3. **Structure Parsing**: JSON content block creation
4. **Quality Control**: Fallback mechanisms and error handling
5. **Cost Tracking**: Generation metrics and usage analytics
6. **Database Storage**: Audit trail with complete generation history

#### Weekly Content Planning System
**52-Week Content Strategy**:
- **Monday (Awareness)**: Big picture, wanderlust, seasonal urgency
- **Wednesday (Practical)**: Evergreen expertise, comparisons, myth-busting
- **Friday (Aspirational)**: Milestones, future planning, deep dives
- **Saturday (Inspirational)**: Wow-factor, lifestyle resonance, shareable content
- **Newsletter (Sunday)**: Weekly digest with persona-specific elements

**Planning Integration**:
- **Seasonal Hooks**: Industry timing and destination-specific content
- **Milestone Intersections**: Special events and cruise milestones
- **Theme Management**: Primary/secondary/tertiary content themes
- **Bulk Generation**: Rate-limited weekly content creation

### Key Components Deep Dive

#### Content Generation Engine
- **Multi-Model AI Integration**: Intelligent model selection based on complexity
- **Brand-Aware Prompting**: CME Writer's Playbook compliance
- **Cost Optimization**: Token usage tracking and budget management
- **Structured Output**: JSON content blocks for consistent rendering
- **Generation Analytics**: Performance metrics and success rates

#### Dashboard Interface (React Architecture)
- **Editorial Workflow**: Draft → Approved → Scheduled → Published tabs
- **Content Generator**: AI-powered creation with real-time previews
- **Content Calendar**: Visual 52-week planning interface
- **Free-Form Editor**: Manual content creation and editing
- **Import Interface**: Bulk data migration and content import
- **Media Library**: R2-integrated asset management

#### Authentication & Session Management
- **Cookie-Based Auth**: HTTP-only sessions with environment-specific security
- **Role-Based Access**: Admin/Editor/Viewer permission levels
- **Password Security**: SHA-256 + salt hashing (development-grade)
- **API Protection**: Middleware-based route authentication

### API Routes Architecture

#### Core API Endpoints
- **`/api/auth/*`**: Authentication, login, logout, session management
- **`/api/create/*`**: AI content generation, post CRUD, statistics
- **`/api/content-advanced/*`**: Plan-based generation, bulk operations
- **`/api/calendar/*`**: Weekly planning, theme management, calendar CRUD
- **`/api/import/*`**: Data migration, bulk import, content validation

#### Database Interaction Patterns
```typescript
// Standard database query pattern
const posts = await env.DB.prepare(`
  SELECT p.*, GROUP_CONCAT(cb.content) as blocks
  FROM posts p 
  LEFT JOIN content_blocks cb ON p.id = cb.post_id 
  WHERE p.status = ? 
  ORDER BY cb.sort_order
`).bind('published').all()

// AI generation with cost tracking
const generation = await env.DB.prepare(`
  INSERT INTO ai_generations (user_id, prompt, response, model_used, tokens_used, cost)
  VALUES (?, ?, ?, ?, ?, ?)
`).bind(userId, prompt, response, model, tokens, cost).run()
```

## Development Workflow

### Agent Integration Points
1. **Planning Phase**: agent-organizer coordinates task breakdown
2. **Development Phase**: fullstack-developer handles implementation
3. **Design Phase**: ui-designer manages interface and UX
4. **State Management**: context-manager maintains consistency
5. **Quality Assurance**: All agents collaborate on testing and validation

### File Structure
```
/src/
├── worker/                    # Cloudflare Workers backend
│   ├── index.ts              # Worker entry point with Hono app
│   └── routes/               # API route modules
│       ├── auth-simple.ts    # Authentication endpoints
│       ├── create.ts         # Content generation and post management
│       ├── content-advanced.ts # Plan-based and bulk generation
│       ├── calendar.ts       # Weekly planning and themes
│       └── import.ts         # Data migration and bulk import
├── react-app/                # Frontend React application
│   ├── App.tsx              # Main app with router and auth
│   ├── components/          # React UI components
│   │   ├── CreateDashboard.tsx    # Main editorial dashboard
│   │   ├── ContentGenerator.tsx   # AI generation interface
│   │   ├── ContentCalendar.tsx    # Weekly planning UI
│   │   ├── FreeFormEditor.tsx     # Manual content editor
│   │   ├── ImportInterface.tsx    # Bulk import interface
│   │   └── LoadingSpinner.tsx     # Loading states
│   ├── index.css            # Global styles with dark mode
│   └── main.tsx             # React app entry point
├── types/                    # Shared TypeScript definitions
│   └── database.ts          # D1 database type definitions
└── utils/                   # Common utilities
    └── auth.ts              # Authentication helpers

/.claude/
├── agents/                  # Required agent definitions
│   ├── fullstack-developer.md
│   ├── ui-designer.md  
│   ├── agent-organizer.md
│   └── context-manager.md
├── agent-config.json       # Agent enforcement configuration  
└── settings.local.json     # Claude Code permissions

/
├── schema.sql              # D1 database schema
├── wrangler.json          # Cloudflare Workers configuration
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite build configuration
└── tsconfig.json          # TypeScript configuration
```

### Development Commands & Workflows

#### **MANDATORY Background Session Commands**
**CRITICAL**: All development server commands MUST be executed in background bash sessions using the Bash tool with `run_in_background: true`.

**Session Setup Protocol**:
```bash
# MANDATORY: Start both background sessions using Claude Bash tool
# Session 1: Vite server (ALL routes)
npm run dev:frontend    # Background: true

# Session 2: Worker server (API-only) 
npm run dev:worker      # Background: true (or --local if login issues)
```

**Session Management**:
```bash
# Status checking (non-blocking)
npm run dev:bg-status            # Check both session status
lsof -i:5174 -i:8787 | grep LISTEN  # Verify ports

# Session cleanup
npm run dev:bg-stop             # Stop all background sessions
pkill -f 'wrangler dev' && pkill -f vite  # Force cleanup

# Health monitoring
npm run dev:status              # Legacy dev-control status
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

#### **Commit Protocol**
**MANDATORY**: Frequent commits after each file modification or logical group of changes.
```bash
# Commit after each file write/edit
git add [files]
git commit -m "Descriptive message

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

#### Development Workflow Patterns
1. **Start Development**: Launch background sessions for Vite (all routes) + Worker (API only)
2. **Frontend Development**: Edit React components → Hot reload on :5174 with full routing
3. **Backend Development**: Edit Worker routes → Auto-reload on :8787 (API endpoints only)
4. **Database Changes**: Edit `schema.sql` → `wrangler d1 migrations apply`
5. **Full Stack Testing**: Vite handles all routing, fetches data from Worker API
6. **Frequent Commits**: Commit after each file write or logical change group
7. **Session Monitoring**: Use agent-organizer to coordinate session health and routing

### Performance & Optimization Notes

#### AI Cost Management
- **Token Tracking**: All generations logged with cost analysis
- **Model Selection**: Automatic optimization based on complexity
- **Rate Limiting**: Built-in delays for bulk operations (2-second intervals)
- **Fallback Systems**: Graceful degradation on API failures
- **Budget Controls**: Cost monitoring and usage analytics

#### Frontend Performance
- **React 19 Features**: Latest concurrent features and optimizations
- **Vite HMR**: Hot module replacement for instant development feedback
- **CSS Optimization**: Modular CSS with dark mode and responsive design
- **Code Splitting**: Route-based lazy loading for optimal bundle sizes
- **State Management**: Efficient React state with minimal re-renders

#### Database Optimization
- **Query Patterns**: Prepared statements with parameter binding
- **Indexing Strategy**: Optimized for content retrieval and user queries
- **Block Architecture**: Efficient content block storage and retrieval
- **Audit Trails**: Complete generation history with cost tracking

## Integration with Master Project

This repository inherits from the master Cruise Made Easy project context while maintaining agent-specific requirements:

- **Master Context**: `/repo/Cruise-Made-Easy/CLAUDE.md` provides architectural overview
- **Local Context**: This file specifies agent requirements and enforcement
- **Agent Coordination**: All four agents work within the broader project ecosystem
- **Cross-Repository**: Agents maintain consistency across related repositories

---

**OPERATIONAL STATUS**: Four mandatory agents installed and configured for comprehensive development support.

**ENFORCEMENT**: Strict mode active - all development tasks MUST engage appropriate agents according to trigger keywords and capabilities.**