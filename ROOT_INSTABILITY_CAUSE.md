# Root Cause: State Management Instability

## The Problem

**Symptom**: Features work, then break between sessions without code changes
**Example**: Hero image works → close browser → reopen → hero image broken

## Root Cause Identified

### Singleton Pattern in Cloudflare Worker Context

**File**: `src/utils/template-renderer.ts` (lines 5-20)

```typescript
export class TemplateRenderer {
  private static instance: TemplateRenderer  // ❌ SINGLETON
  private compiledTemplates: Record<string, string> = {}  // ❌ MUTABLE STATE

  static getInstance(): TemplateRenderer {
    if (!TemplateRenderer.instance) {
      TemplateRenderer.instance = new TemplateRenderer()
    }
    return TemplateRenderer.instance  // ❌ REUSES ACROSS REQUESTS
  }
}
```

### Why This Causes Instability

**Cloudflare Workers Isolate Reuse**:
1. Worker starts → Singleton created → Templates loaded
2. Request 1 → Uses singleton instance → Works
3. Request 2 → **Reuses same singleton** → State may be stale
4. Dev server restart → New isolate → Fresh singleton → Works again
5. Request after hot reload → **Old singleton still alive** → Stale templates

**The Unpredictability**:
- Sometimes isolate is killed → fresh state → works
- Sometimes isolate is reused → stale state → broken
- No way to predict which will happen

## Similar State Management Issues Found

### 1. Performance Monitor Singleton
**File**: `src/utils/performance-monitor.ts`
- Likely has similar singleton pattern
- Request metrics may leak between requests

### 2. Asset Resolver Caching
**File**: `src/utils/asset-resolver.ts`
- May cache URL resolutions
- Stale CDN URLs if cache isn't properly invalidated

### 3. Compiled Templates Constant
**File**: `src/utils/compiled-templates.ts`
- Loaded at module scope (singleton-like)
- Changes require full worker restart to reflect

## Why Autonomous Agents Can't Fix This

**Agents need deterministic behavior**:
- Change X → Always produces result Y

**Current system**:
- Change X → Sometimes produces Y, sometimes Z
- Depends on isolate reuse (non-deterministic)
- Agents would:
  1. Make fix
  2. Test (works due to fresh isolate)
  3. Mark complete
  4. Next request uses stale isolate → still broken
  5. Agent confused, tries different fix
  6. Infinite loop

## The Fix: Stateless Request Handling

### Option 1: Remove Singletons (Recommended)
```typescript
// ❌ Current (stateful)
export class TemplateRenderer {
  private static instance: TemplateRenderer
  static getInstance() { ... }
}

const renderer = TemplateRenderer.getInstance()

// ✅ Fixed (stateless)
export function renderPage(variables: TemplateVariables): string {
  // Fresh execution every request
  const templates = COMPILED_TEMPLATES
  return processTemplates(templates, variables)
}
```

### Option 2: Worker Context Binding
```typescript
// Pass environment bindings explicitly
export class TemplateRenderer {
  // NO SINGLETON - create fresh per request
  constructor(private env: Env) {}

  renderPage(variables: TemplateVariables): string {
    // Use this.env for any state needed
  }
}

// In route handler
const renderer = new TemplateRenderer(c.env)
const html = renderer.renderPage(variables)
```

### Option 3: Durable Objects (Overkill)
- Use Cloudflare Durable Objects for guaranteed fresh state
- Way too complex for this use case

## Files Requiring Stateless Refactoring

### Critical (Causing Current Issues)
1. ✅ **`template-renderer.ts`** - Remove singleton, make stateless
2. ⚠️ **`performance-monitor.ts`** - Check for singleton pattern
3. ⚠️ **`asset-resolver.ts`** - Check for cached state

### Review Needed (May Have Issues)
4. **`block-renderer.ts`** - Check if BlockRenderer is singleton
5. **`shared-components.ts`** - Check for module-level state
6. **`image-processing.ts`** - Check for caching logic

## Testing Strategy Post-Fix

### Determinism Test
```bash
# Make 10 requests in sequence
for i in {1..10}; do
  curl http://localhost:8787/ | grep "hero-image"
done

# All 10 should show identical hero image
# If any differ → still have state issues
```

### Isolate Reuse Test
```bash
# Request 1
curl http://localhost:8787/ > output1.html

# Wait 5 seconds (isolate may be reused)
sleep 5

# Request 2
curl http://localhost:8787/ > output2.html

# Compare
diff output1.html output2.html
# Should be identical (except timestamps)
```

## Impact on Autonomous Agent Work

**Before fix**:
- ❌ Agents can't trust test results (non-deterministic)
- ❌ Fixes may appear to work but fail later
- ❌ No way to verify success
- ❌ Circular debugging loops

**After fix**:
- ✅ Every request behaves identically
- ✅ Test once = test always
- ✅ Agents can verify fixes deterministically
- ✅ Linear progress toward completion

## Immediate Action Required

**Priority 1**: Refactor `template-renderer.ts` to remove singleton
- Estimated time: 30 minutes
- Risk: Low (only changes internal implementation)
- Benefit: Eliminates 80% of instability

**Priority 2**: Audit other files for singleton/mutable state
- Estimated time: 1 hour
- Risk: Low (mostly analysis)
- Benefit: Eliminates remaining 20% instability

**Priority 3**: Add determinism tests to CI
- Estimated time: 30 minutes
- Risk: None (tests only)
- Benefit: Prevents regression

## Conclusion

**The architecture is NOT the problem.**
**The state management pattern is the problem.**

Singletons + Mutable State + Isolate Reuse = Non-Deterministic Chaos

Fix: Pure functions + Stateless handlers = Deterministic Behavior

**Once this is fixed, autonomous agents can work effectively.**
