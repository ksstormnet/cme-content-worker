# CME Content Worker Architecture Modernization Plan

## **Project Overview**
Transform the current hybrid routing architecture into a clean development/production split where Vite handles all routes in development and Worker handles everything in production.

## **Current Problems**
- **Routing Conflicts**: Worker serves blog content, Vite serves admin, creating hybrid routing mess
- **Development Complexity**: Dual servers with confusing asset and route precedence
- **Session Management**: Development servers hijack Claude sessions during startup/restart
- **Inconsistent Architecture**: Different routing logic between development and production

## **Target Architecture**

### **Development Mode**
```
Vite Server (localhost:5174) - Serves ALL routes:
├── / (React Router → fetch blog data from Worker API)
├── /admin/* (React Router → admin interface SPA)
├── /category/:slug (React Router → fetch category data from Worker API)
├── /:category/:post (React Router → fetch post data from Worker API)
└── /api/* → Proxied to Worker

Worker Server (localhost:8787) - API ONLY:
└── /api/* (Database operations, AI generation, auth, etc.)
```

### **Production Mode**
```
Worker Server (blog.cruisemadeeasy.com) - Serves EVERYTHING:
├── / (Server-rendered blog homepage with database content)
├── /category/* (Server-rendered category pages)
├── /:category/:post (Server-rendered individual post pages)
├── /admin/* (Serves React build files - SPA routing)
├── /assets/* (Static React build assets)
└── /api/* (API endpoints)
```

## **Implementation Phases**

### **Phase 1: Background Session Management Setup**
**Objective**: Eliminate Claude session hijacking during development server operations.

**Tasks**:
1. **Configure Background Sessions**:
   - Session 1: Vite server (all routes)
   - Session 2: Worker server (API-only)
   - Use agent-organizer for session coordination

2. **Update Development Scripts**:
   - Modify `npm run dev:frontend` for background execution
   - Modify `npm run dev:worker` for API-only mode
   - Create session health monitoring commands

3. **Test Session Management**:
   - Verify servers start in background without blocking Claude
   - Test session monitoring and status checking
   - Validate proper cleanup and restart procedures

**Success Criteria**:
- Development servers start/stop without hijacking Claude sessions
- Reliable session monitoring and coordination
- Clean background process management

---

### **Phase 2: React Router Enhancement for Blog Content**
**Objective**: Enable Vite to handle blog content routes via React Router with API data fetching.

**Tasks**:
1. **Add Blog Content Routes to React App**:
   - Create route for homepage (`/`) in React Router
   - Add category routes (`/category/:categorySlug`)
   - Add individual post routes (`/:category/:postSlug`)

2. **Create Blog Content Components**:
   ```typescript
   // src/react-app/components/BlogHomepage.tsx
   // src/react-app/components/CategoryPage.tsx  
   // src/react-app/components/PostPage.tsx
   ```

3. **Implement API Data Fetching**:
   - Homepage component fetches recent posts via `/api/posts`
   - Category component fetches posts by category via `/api/category/:slug`
   - Post component fetches individual post via `/api/posts/:category/:slug`

4. **Maintain Admin Routes**:
   - Keep existing admin interface unchanged
   - Preserve login/auth flows
   - Ensure no conflicts with new blog routes

**Implementation Details**:
```typescript
// Add to App.tsx Routes:
<Route path="/" element={<BlogHomepage />} />
<Route path="/category/:categorySlug" element={<CategoryPage />} />
<Route path="/:category/:postSlug" element={<PostPage />} />
// Keep existing admin routes unchanged
```

**Success Criteria**:
- Vite serves blog content routes via React Router
- API data fetching works for all blog content
- Admin interface remains fully functional
- No routing conflicts between blog and admin

---

### **Phase 3: Worker Route Segregation**
**Objective**: Configure Worker to serve API-only in development, full routing in production.

**Tasks**:
1. **Environment-Conditional Routing in Worker**:
   ```typescript
   // src/worker/index.ts modifications
   if (c.env.ENVIRONMENT === "development") {
     // Only serve /api/* routes
     // No static asset serving
     // No blog content routes
   } else {
     // Production: serve static assets + blog routes + API
   }
   ```

2. **Remove Development Redirects**:
   - Remove redirects to Vite server (no longer needed)
   - Remove dual-server asset serving logic
   - Simplify routing logic

3. **API-Only Development Mode**:
   - Worker only handles `/api/*` endpoints in development
   - Remove static asset serving in development
   - Remove blog content generation in development

4. **Test API Endpoints**:
   - Verify all `/api/*` endpoints work from Vite
   - Test authentication and session management
   - Validate database operations and AI generation

**Implementation Details**:
```typescript
// Conditional routing example:
if (c.env.ENVIRONMENT === "development") {
  // Skip static asset serving
  // Skip blog content routes  
} else {
  // Add production static asset handling
  // Add production blog content routes
}
```

**Success Criteria**:
- Worker serves only API endpoints in development
- All API functionality preserved and working
- Clean separation between development and production logic
- No routing conflicts or confusion

---

### **Phase 4: Build Integration & Production Deployment**
**Objective**: Ensure seamless development → production transition with proper asset building.

**Tasks**:
1. **Configure Vite Build Output**:
   ```typescript
   // vite.config.ts
   build: {
     outDir: 'dist/client', // Worker's static directory
     // Ensure proper asset paths for production
   }
   ```

2. **Update Wrangler Assets Configuration**:
   ```json
   // wrangler.json
   "assets": {
     "directory": "./dist/client",
     "not_found_handling": "single-page-application"
   }
   ```

3. **Build Process Integration**:
   - `npm run build` creates production-ready React build
   - Assets output to Worker's expected directory
   - Worker configured to serve built assets in production

4. **Production Route Testing**:
   - Blog content routes work via Worker server-side rendering
   - Admin routes fall back to React SPA routing
   - Static assets served correctly
   - API endpoints function in production environment

**Success Criteria**:
- Smooth development → production build process
- Worker serves all routes correctly in production
- React admin interface works in production
- Blog content renders server-side in production

---

### **Phase 5: Documentation & Cleanup**
**Objective**: Update documentation and remove obsolete complexity.

**Tasks**:
1. **Update Development Workflow Documentation**:
   - Document background session management requirements
   - Update routing architecture explanations
   - Add troubleshooting guides for new setup

2. **Clean Up Obsolete Code**:
   - Remove complex development server management (if no longer needed)
   - Clean up routing redirects and dual-server logic
   - Simplify development scripts

3. **Agent Integration Documentation**:
   - Document agent orchestration for session management
   - Update trigger-based vs always-active agent usage
   - Add coordination patterns for multi-session development

4. **Testing Documentation**:
   - Add testing procedures for development vs production routing
   - Document API endpoint testing from Vite
   - Add session management troubleshooting

**Success Criteria**:
- Clear documentation of new architecture
- No obsolete or confusing code remains
- Comprehensive troubleshooting guides
- Agent coordination patterns documented

---

## **Implementation Strategy**

### **Least-Disruptive Approach**
1. **Additive Changes**: Add new routes/components without removing existing functionality
2. **Phase Testing**: Test each phase independently before proceeding
3. **Rollback Plan**: Keep existing functionality until new approach proven stable
4. **Incremental Migration**: Gradually shift from old to new architecture

### **Risk Mitigation**
- **Backup Current State**: Commit current working state before starting
- **Feature Flags**: Use environment variables to toggle new vs old behavior
- **Parallel Routes**: Run old and new routes simultaneously during transition
- **Comprehensive Testing**: Verify each phase works before moving forward

### **Quality Assurance**
- **Agent Coordination**: Use agent-organizer for complex multi-phase coordination
- **Context Management**: Use context-manager for state consistency across phases
- **Development Patterns**: Follow fullstack-developer patterns for implementation
- **UI Consistency**: Follow ui-designer patterns for interface work

---

## **Success Metrics**

### **Development Experience**
- ✅ All routes accessible via Vite (localhost:5174)
- ✅ Hot module replacement works for all components
- ✅ API calls work seamlessly from React components
- ✅ No session hijacking during server operations
- ✅ Clean background session management

### **Production Deployment**
- ✅ Worker serves all routes correctly
- ✅ Blog content renders server-side for SEO
- ✅ Admin interface works as SPA
- ✅ Static assets served efficiently
- ✅ API endpoints function in production

### **Architecture Quality**
- ✅ Clear separation of concerns (dev vs prod)
- ✅ No routing conflicts or confusion
- ✅ Simplified development workflow
- ✅ Maintainable codebase
- ✅ Consistent build → deploy process

---

## **Commit Strategy**
**Frequent commits following each logical change:**

```bash
# After each phase completion:
git add .
git commit -m "Phase X: [Description of changes]

- Specific change 1
- Specific change 2  
- Testing completed

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Commit after each file write/edit within phases:**
- Individual component creation
- Configuration file updates
- Route additions or modifications
- Documentation updates

---

## **Next Steps**
1. **Fresh Session**: Implement this plan in a new Claude session with clean context
2. **Phase-by-Phase Execution**: Complete each phase fully before proceeding
3. **Continuous Testing**: Verify functionality at each step
4. **Documentation Updates**: Keep CLAUDE.md current with implementation progress

This plan provides a clear roadmap for transforming the architecture while minimizing disruption and maintaining functionality throughout the transition.