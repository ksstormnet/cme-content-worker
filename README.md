# CME Content Worker - Hybrid Blog Architecture

**CRITICAL**: This project is currently under architectural transformation. Do NOT implement features until the new hybrid architecture is complete.

## Current Status: Architecture Transformation In Progress

The project is being transformed from a pure React application to a hybrid architecture:
- **Admin Interface**: Pure React application (existing functionality preserved)
- **Public Blog**: Server-side rendered templates with React components for dynamic content

For implementation details, see the task-specific implementation documents in this directory.

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

## Architecture Transformation Status

**⚠️ TRANSFORMATION IN PROGRESS**: Do not modify the existing codebase until implementation documents are complete and approved.

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/)
- [Hono Documentation](https://hono.dev/)
