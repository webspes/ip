# replit.md

## Overview

This is an **AI-powered domain name generator** application. Users describe a project or topic, and the app uses OpenAI to generate creative name suggestions, then checks domain availability via DNS lookups. The app features IP-based access control — only a specific allowed IP address can use the name generator form. It includes basic internationalization (English and Norwegian) and a dark developer-themed UI.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Overall Structure

The project follows a **monorepo pattern** with three main directories:

- **`client/`** — React single-page application (frontend)
- **`server/`** — Express.js API server (backend)
- **`shared/`** — Shared types, schemas, and route definitions used by both client and server

### Frontend Architecture

- **Framework:** React with TypeScript, bundled by Vite
- **Routing:** Wouter (lightweight client-side router) — currently just `/` (Home) and a 404 page
- **State Management:** TanStack React Query for server state (API calls, caching)
- **UI Components:** shadcn/ui component library (new-york style) built on Radix UI primitives
- **Styling:** Tailwind CSS with CSS variables for theming, dark mode by default
- **Animations:** Framer Motion for smooth UI transitions
- **Internationalization:** Simple custom i18n system in `client/src/lib/i18n.ts` (detects browser language, supports English and Norwegian)
- **Path aliases:** `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture

- **Framework:** Express.js (v5) running on Node.js with TypeScript (executed via `tsx`)
- **API Pattern:** RESTful JSON API under `/api/` prefix
- **Key Endpoints:**
  - `GET /api/ip` — Returns visitor's IP address and whether they're allowed to use the generator
  - `POST /api/names/generate` — Accepts a topic and count, generates names via OpenAI, checks domain availability via DNS
- **IP Access Control:** The `ALLOWED_IP` environment variable restricts who can use the name generator. The server compares the request IP against this value.
- **AI Integration:** OpenAI API (supports both direct `OPENAI_API_KEY` and Replit AI Integrations via `AI_INTEGRATIONS_OPENAI_API_KEY`)
- **Build:** Production build uses esbuild for server bundling and Vite for client bundling. Output goes to `dist/`

### Shared Layer

- **Schema definitions** in `shared/schema.ts` using Drizzle ORM with Zod validation via `drizzle-zod`
- **Route contracts** in `shared/routes.ts` — defines API paths, methods, and response schemas using Zod, ensuring type-safe API communication between client and server
- **Chat models** in `shared/models/chat.ts` — additional tables for conversations and messages (used by Replit integration modules)

### Data Storage

- **Database:** PostgreSQL via `DATABASE_URL` environment variable
- **ORM:** Drizzle ORM with `node-postgres` driver
- **Schema push:** `npm run db:push` uses `drizzle-kit push` to sync schema to database
- **Main table:** `name_ideas` — logs generated names with prompt, generated name, availability status, and timestamp
- **Additional tables:** `conversations` and `messages` (for chat integration features)
- **Storage pattern:** `server/storage.ts` defines an `IStorage` interface with a `DatabaseStorage` implementation

### Replit Integration Modules

The `server/replit_integrations/` and `client/replit_integrations/` directories contain pre-built modules for:
- **Audio/Voice:** Voice recording, streaming audio playback, speech-to-text, text-to-speech
- **Chat:** Conversation CRUD with OpenAI streaming
- **Image:** Image generation via OpenAI's gpt-image-1 model
- **Batch:** Batch processing with rate limiting and retries

These are utility modules available for use but not all are actively wired into the main application routes.

### Development vs Production

- **Development:** `npm run dev` uses Vite dev server with HMR, proxied through Express
- **Production:** `npm run build` creates optimized bundles, `npm start` serves static files from `dist/public`

## External Dependencies

### Required Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required)
- `ALLOWED_IP` — IP address allowed to access the name generator (optional but recommended)
- `OPENAI_API_KEY` or `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key for name generation (one required for AI features)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Custom base URL when using Replit AI Integrations

### Third-Party Services
- **OpenAI API** — Powers the AI name generation (GPT models)
- **DNS lookups** — Used server-side (`dns/promises`) to check domain availability

### Key npm Dependencies
- `express` v5 — HTTP server
- `drizzle-orm` + `drizzle-kit` — Database ORM and migration tooling
- `openai` — OpenAI SDK
- `@tanstack/react-query` — Server state management
- `wouter` — Client-side routing
- `framer-motion` — Animations
- `zod` + `drizzle-zod` — Schema validation
- `shadcn/ui` ecosystem — Radix UI, class-variance-authority, tailwind-merge, clsx