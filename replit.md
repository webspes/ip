# replit.md

## Overview

This is an **IP address display and AI-powered domain name generator** application. It shows visitor and server IP addresses with type classification, and when the visitor's IP matches the `ALLOWED_IP` environment variable, unlocks a form that uses OpenAI to generate website name suggestions and check their domain availability via DNS resolution. The app requires no database — it is fully stateless with optional file-based logging.

## User Preferences

Preferred communication style: Simple, everyday language (Norwegian).

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
  - `GET /api/ip` — Returns visitor's IP addresses (from x-forwarded-for), type classification, and access status
  - `GET /api/server-ip` — Returns server's outbound public IP (via ipify.org) and network interface IPs
  - `POST /api/names/generate` — Accepts a topic and count, generates names via OpenAI, checks domain availability via DNS
- **IP Access Control:** The `ALLOWED_IP` environment variable restricts who can use the name generator. The server compares the request IP against this value.
- **AI Integration:** OpenAI API (supports both direct `OPENAI_API_KEY` and Replit AI Integrations via `AI_INTEGRATIONS_OPENAI_API_KEY`)
- **Build:** Production build uses esbuild for server bundling and Vite for client bundling. Output goes to `dist/`

### Shared Layer

- **Request schemas** in `shared/schema.ts` using Zod for validation
- **Route contracts** in `shared/routes.ts` — defines API paths, methods, and response schemas using Zod, ensuring type-safe API communication between client and server

### Data Storage

- **No database required** — the app is fully stateless
- **File logging:** `server/storage.ts` appends generated name ideas to `name_ideas.log` as JSON lines (one entry per line)
- **Logging is best-effort** — failures are silently ignored

### Development vs Production

- **Development:** `npm run dev` uses Vite dev server with HMR, proxied through Express
- **Production:** `npm run build` creates optimized bundles, `npm start` serves static files from `dist/public`

## External Dependencies

### Environment Variables
- `ALLOWED_IP` — IP address allowed to access the name generator (optional)
- `OPENAI_API_KEY` or `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key for name generation (optional, needed for AI features)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Custom base URL when using Replit AI Integrations

### Third-Party Services
- **OpenAI API** — Powers the AI name generation (GPT models)
- **DNS lookups** — Used server-side (`dns/promises`) to check domain availability
- **ipify.org** — Used to detect server's outbound public IP

### Key npm Dependencies
- `express` v5 — HTTP server
- `openai` — OpenAI SDK
- `@tanstack/react-query` — Server state management
- `wouter` — Client-side routing
- `framer-motion` — Animations
- `zod` — Schema validation
- `shadcn/ui` ecosystem — Radix UI, class-variance-authority, tailwind-merge, clsx
