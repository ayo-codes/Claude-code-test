# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (install deps + generate Prisma client + run migrations)
npm run setup

# Development server
npm run dev

# Development server as background daemon (logs to logs.txt)
npm run dev:daemon

# Build for production
npm run build

# Lint
npm run lint

# Run all tests
npm test

# Run a single test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Reset database
npm run db:reset
```

## Environment

Create a `.env` file with:
```
ANTHROPIC_API_KEY=your-api-key-here
```

Without `ANTHROPIC_API_KEY`, the app uses a `MockLanguageModel` (see `src/lib/provider.ts`) that returns static pre-written components instead of calling Claude.

## Architecture

UIGen is an AI-powered React component generator. Users describe a component in chat; Claude generates it using tools that manipulate a **virtual file system**; the output is compiled in-browser and rendered in a live preview iframe.

### Request Flow

1. User message → `POST /api/chat` (`src/app/api/chat/route.ts`)
2. Route reconstructs a `VirtualFileSystem` from the serialized `files` sent by the client
3. `streamText` (Vercel AI SDK) calls Claude with two tools: `str_replace_editor` and `file_manager`
4. Claude creates/edits files in the virtual FS via those tools
5. On finish, if user is authenticated and a `projectId` is present, the updated messages + FS are persisted to SQLite via Prisma
6. The client streams the response, updating its local FS state in real time
7. `createImportMap` (`src/lib/transform/jsx-transformer.ts`) transforms JSX/TSX via Babel standalone and creates blob URLs, building an ES module import map for the preview iframe

### Virtual File System

`VirtualFileSystem` (`src/lib/file-system.ts`) is an in-memory tree of `FileNode` objects. It lives server-side during a request (reconstructed from JSON each time) and client-side in React state. Files are never written to disk. `serialize()` / `deserializeFromNodes()` convert between the Map-based tree and plain JSON.

### AI Tools

- `str_replace_editor` (`src/lib/tools/str-replace.ts`) — view files, create files, str_replace within a file, insert lines
- `file_manager` (`src/lib/tools/file-manager.ts`) — rename, delete files/directories

### Preview Pipeline

`src/lib/transform/jsx-transformer.ts`:
- `transformJSX` — compiles JSX/TSX to JS via `@babel/standalone`; strips CSS imports; detects third-party vs local imports
- `createImportMap` — builds an ES importmap: local files become blob URLs, third-party packages resolve to `https://esm.sh/<pkg>`, missing local imports get auto-generated placeholder modules
- `createPreviewHTML` — generates the full HTML document injected into the preview iframe; includes React 19 from esm.sh, Tailwind CDN, and an `ErrorBoundary`

The AI-generated entry point must be `/App.jsx` and must have a default export. The `@/` import alias maps to the VFS root `/`.

### Auth

JWT-based sessions stored in httpOnly cookies (`auth-token`). `src/lib/auth.ts` is server-only. The middleware (`src/middleware.ts`) protects `/api/projects` and `/api/filesystem`. Users can also use the app anonymously; anonymous work is tracked in `sessionStorage` (`src/lib/anon-work-tracker.ts`) and can be saved to a new account on sign-up.

### Data Model (Prisma / SQLite)

- `User`: id, email, hashed password
- `Project`: name, optional userId, `messages` (JSON string), `data` (JSON string of the serialized VFS)

Prisma client is generated to `src/generated/prisma`.

> Always reference `prisma/schema.prisma` when you need to understand the structure of the database. It is the single source of truth for the data model.

## Working Style

- **Always explain changes with comments**: When editing code, add clear comments that explain *what* the code does, *why* the change was made, and *how* it fits into the larger flow.
- **Explain steps in detail**: The developer is actively learning — narrate reasoning and decisions, not just actions.
- **Ask where to save preferences**: Whenever a new preference or instruction comes up, ask whether to save it to `CLAUDE.md` (shared, project-wide) or `MEMORY.md` (personal, not committed to git) before saving.

### Key Conventions for Generated Components

The system prompt (`src/lib/prompts/generation.tsx`) enforces:
- Every project must have `/App.jsx` as the entry point
- Style with Tailwind CSS, not inline styles
- Import local files using `@/` alias (e.g., `@/components/Button`)
- No HTML files — `/App.jsx` is the sole entry point
