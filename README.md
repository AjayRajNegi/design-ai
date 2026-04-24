# Design AI

Design AI is a Next.js application that generates mobile app UI screens from a text prompt.  
It creates projects, plans screens with AI, generates HTML-based frames, and renders project thumbnails.

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui components
- Prisma ORM with MongoDB
- Kinde authentication
- Inngest for background job orchestration and realtime progress events
- OpenRouter (AI SDK provider) for model calls
- Puppeteer for screenshot generation

## Features

- Prompt-to-UI project generation
- Multi-screen frame generation (3-4 screens per run)
- Project history and project detail pages
- Theme selection and theme-based UI generation
- Generated project thumbnails from HTML screenshots
- Realtime generation status updates via Inngest

## Prerequisites

- Node.js 20+ (or Bun)
- MongoDB database
- A Kinde app for authentication
- OpenRouter API key
- Unsplash access key (used by the image tool in generation)

## Environment Variables

Create a `.env` file in the project root:

```bash
DATABASE_URL="mongodb+srv://..."
OPENROUTER_API_KEY="..."
UNSPLASH_ACCESS_KEY="..."
```

Kinde is also required. Add the Kinde environment variables expected by `@kinde-oss/kinde-auth-nextjs` for your app setup.

## Installation

Using npm:

```bash
npm install
```

Using Bun:

```bash
bun install
```

## Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - build for production
- `npm run start` - run production server
- `npm run lint` - run ESLint

`prisma generate` runs automatically on install via `postinstall`.

## Data Model

The database has two core models:

- `Project` - user-owned project metadata, selected theme, thumbnail
- `Frame` - generated HTML screen content for a project

Each project can have multiple frames.

## API Routes

- `GET /api/project` - list current user's recent projects
- `POST /api/project` - create a project and trigger screen generation
- `GET /api/project/:id` - fetch one project with frames
- `POST /api/project/:id` - generate additional frames for an existing project
- `PATCH /api/project/:id` - update project theme
- `POST /api/screenshot` - render HTML to PNG and optionally save project thumbnail
- `GET|POST|PUT /api/inngest` - Inngest function handler endpoint
- `GET /api/auth/[kindeAuth]` - Kinde auth handler

## How Generation Works

1. User submits a prompt.
2. A project is created in MongoDB.
3. An Inngest event (`ui/generate.screens`) is sent.
4. Inngest function:
   - analyzes prompt and picks/plans screens,
   - generates HTML for each screen,
   - stores frames in DB,
   - publishes realtime progress events.
5. UI subscribes to generation progress and displays created frames.

## Project Structure

```text
app/                  Next.js routes, API handlers, and server actions
components/           UI, canvas, and shared components
context/              React context providers
features/             Client data hooks and feature logic
inngest/              Inngest client and background functions
lib/                  Shared utilities and integrations (Prisma/OpenRouter)
prisma/               Prisma schema and config
types/                Shared TypeScript types
```

## Deployment Notes

- The screenshot route uses `puppeteer-core` + `@sparticuz/chromium-min` in Vercel production.
- In local development, it falls back to full `puppeteer`.
- Ensure all required environment variables are configured in your deployment platform.
