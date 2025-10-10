# CME Content Worker - Hybrid Blog Architecture

**Status**: Stable architecture with identified improvements in progress.

## Current Status: Stable with Planned Enhancements

The project implements a hybrid architecture:
- **Admin Interface**: Pure React application with TipTap WYSIWYG editor
- **Public Blog**: Server-side rendered templates with semantic block system

**Next Steps**: See `MASTER_IMPLEMENTATION_PLAN.md` for detailed execution roadmap.

## Architecture Overview

### Technology Stack
- **Backend**: Cloudflare Workers + Hono.js + TypeScript
- **Frontend**: React 19.0.0 + TypeScript + Vite 6.0.0
- **Database**: Cloudflare D1 SQLite
- **Storage**: Cloudflare R2 object storage
- **Templates**: Static HTML with parameter replacement
- **Content**: React server-side rendering for complex blocks

### Dual Application Structure
1. **Pure React Admin** (`/admin/*` routes) - Content management interface
2. **Hybrid Public Blog** (all other routes) - Server-rendered templates + React components

## Development Setup

See `setup.md` for detailed setup instructions.

**IMPORTANT**: During the transformation, use the background session development pattern specified in `CLAUDE.md`.

## Implementation Plan

See `MASTER_IMPLEMENTATION_PLAN.md` for:
- Critical path to enable autonomous development (2.5 hours)
- Media library UX improvements
- Semantic block library implementation
- Complete project timeline and priorities

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/)
- [Hono Documentation](https://hono.dev/)
