# Design AI — Deep Project Guide

This document is a map of how **Design AI** actually works: the product idea, the request lifecycle, every important module, and the pitfalls you will hit when you start changing code.

Read it in order the first time. After that, use the [file index](#12-file-index) and [mental model](#2-mental-model) as a lookup.

---

## 1. What this product is

Design AI turns a **natural-language prompt** into a **Figma-like infinite canvas** of **mobile UI screens**.

Each screen is not a React component. It is a **blob of HTML + Tailwind classes**, wrapped in a full HTML document, rendered inside an **iframe**. Themes are **CSS custom properties** injected into that wrapper. Images come from **Unsplash** (via an AI tool) or **pravatar.cc**. Charts are **inline SVG**.

The generation work is **not** done in the Next.js request that creates the project. The API only:

1. Authenticates the user (Kinde)
2. Creates a `Project` row
3. Fires an Inngest event
4. Returns immediately so the client can navigate to `/project/[id]`

The actual LLM work (plan screens → generate HTML → persist `Frame` rows) runs in an **Inngest function**. The browser listens to **Inngest Realtime** on channel `user:{userId}` and paints skeleton frames, then real frames, as events arrive.

**One-sentence architecture:** *Authenticated Next.js app + Prisma/Postgres store + Inngest worker that calls Gemini via OpenRouter + iframe canvas that renders themed HTML.*

---

## 2. Mental model

Think in three layers:

```text
┌─────────────────────────────────────────────────────────────┐
│  PRODUCT UI (React / Next App Router)                       │
│  Landing → create project → infinite canvas of DeviceFrames │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP + Realtime token
┌──────────────────────────▼──────────────────────────────────┐
│  CONTROL PLANE (Route Handlers + Server Actions)            │
│  Auth, CRUD, event send, screenshot, subscription token     │
└──────────────────────────┬──────────────────────────────────┘
                           │ Inngest event  ui/generate.screens
┌──────────────────────────▼──────────────────────────────────┐
│  GENERATION PLANE (Inngest + OpenRouter + Prisma)           │
│  Analyze prompt → N HTML screens → Frame rows + publish     │
└─────────────────────────────────────────────────────────────┘
```

**Entities you must keep straight:**

| Concept | What it is | Where it lives |
|---|---|---|
| **Project** | Named collection owned by a Kinde user. Optional `theme` id and `thumbnail` data-URL. | `Project` table |
| **Frame** | One generated screen: `title` + `htmlContent` (raw inner HTML, not a full document). | `Frame` table, child of Project |
| **Theme** | CSS variable block (`--background`, `--primary`, …). Identified by string id (`midnight`, `ocean-breeze`, …). | `types/themes.ts` (`THEME_LIST`), copied onto `Project.theme` |
| **DeviceFrame** | Client widget: `react-rnd` box + iframe `srcDoc` of wrapped HTML. | `components/canvas/DeviceFrame.tsx` |
| **Canvas** | Zoom/pan board (`react-zoom-pan-pinch`) that lays DeviceFrames in a row. | `components/canvas/Canvas.tsx` |
| **Generation run** | One Inngest invocation for `ui/generate.screens`. Either first-run (no existing frames) or follow-up (existing frames + theme passed in). | `inngest/functions/generateScreen.ts` |

**Two generation modes:**

1. **New project** (`POST /api/project`): event payload is `{ userId, projectId, prompt }`. Analysis **chooses a theme** and writes it to the project.
2. **Add screens** (`POST /api/project/[id]`): payload also includes `frames` (up to 4 HTML blobs as context) and `theme`. Analysis **must not** overwrite the stored theme.

---

## 3. Tech stack (as used, not as advertised)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js **16.1.6** App Router, React **19** | Auth gate lives in `proxy.ts` (Next 16’s middleware-style file), not `middleware.ts` |
| Language | TypeScript | Prisma client is generated into `lib/generated/prisma` |
| Styling | Tailwind **4**, shadcn/ui, `next-themes` | App chrome uses Jost via `next/font`. Generated screens load Tailwind **from CDN** inside the iframe |
| Auth | Kinde (`@kinde-oss/kinde-auth-nextjs`) | Catch-all `app/api/auth/[kindeAuth]/route.ts` |
| Data | Prisma **7** + `pg` adapter | Schema says **PostgreSQL**. `.env.example` still shows a MongoDB URL — that is stale |
| Jobs | Inngest + `@inngest/realtime` | Client has `isDev: false` always |
| LLM | Vercel AI SDK `ai` + `@openrouter/ai-sdk-provider` | Model: `google/gemini-2.5-flash-lite` |
| Images | Unsplash Search API | Tool in `inngest/functions/tool.ts` |
| Screenshots | Puppeteer locally; `puppeteer-core` + `@sparticuz/chromium-min` on Vercel | `app/api/screenshot/route.ts` |
| Client data | TanStack Query + axios | Hooks in `features/` |
| Canvas | `react-zoom-pan-pinch` + `react-rnd` | Select vs Hand tools in `constants/canvas.ts` |

Package manager in the repo is **Bun** (`bun.lock`) but npm scripts work too.

---

## 4. How a request actually flows

### 4.1 Landing → first generation

```text
User on `/` (public)
  └─ LandingSection
       ├─ PromptInput → useCreateProject()
       │     POST /api/project { prompt }
       │       ├─ Kinde getUser()  (must be signed in or this 500s)
       │       ├─ generateProjectName(prompt)  [server action, Gemini]
       │       ├─ prisma.project.create({ userId, name })
       │       ├─ inngest.send("ui/generate.screens", { userId, projectId, prompt })
       │       └─ JSON { success, data: project }
       └─ onSuccess → router.push(`/project/${id}`)

`/project/[id]`
  ├─ useGetProjectById → GET /api/project/:id  (project + frames)
  ├─ CanvasProvider(hasInitialData = frames.length > 0)
  │     If no frames yet → loadingStatus starts as "running"
  │     Subscribes to Inngest realtime (token from fetchRealtimeSubscriptionToken)
  └─ Canvas
        listens loadingStatus → when "completed" auto-saves thumbnail
```

**Auth nuance:** `/` is in `publicPaths`, so anyone can see the landing page. Creating a project hits `/api/project`, which is **not** public. Unauthenticated users who click Design will fail the API (currently a generic 500, because the handler `throw`s `"Unauthorized."` into a catch-all).

### 4.2 Inngest worker (the real product)

Event name: `ui/generate.screens`  
Function id: `generate-ui-screen`  
File: `inngest/functions/generateScreen.ts`

Channel for all publishes: `user:${userId}`

| Step | Inngest step | Publishes topic | Side effects |
|---|---|---|---|
| Start | (function body) | `generation.start` | status `running` |
| Plan | `analyze-and-plan-screens` | `analysis.start` then `analysis.complete` | `generateObject` with Zod `AnalysisSchema`; on first-run, `project.theme` is updated |
| Each screen | `generate-screen-{i}` | `frame.craeted` (**typo — see §11**) | `generateText` + Unsplash tool; `prisma.frame.create` |
| Done | (function body) | `generation.complete` | status `completed` |

**Analysis model call:** structured object

```ts
{
  theme: string,          // must match a THEME_LIST id
  screens: [{
    id,                   // kebab-case, used as skeleton frame id in the UI
    name,                 // display title, stored as Frame.title
    purpose,
    visualDescription     // dense layout brief fed into the HTML generator
  }]  // Zod: min 3, max 4  (prompt text says 1–4; schema wins)
}
```

**HTML model call:** free-form text with `tools: { unsplashTool }`, `stopWhen: stepCountIs(5)`. Output is scraped for the first `<div>…</div>` match and markdown fences are stripped.

**Realtime vs DB:** Frames are durable in Postgres. The canvas does **not** refetch after generation; it mutates local state from realtime messages. If the typo’d topic is not received, skeletons stay empty until a full page reload (GET project).

### 4.3 Follow-up generation (more screens on an existing project)

Toolbar wand → `useGenerateDesignById` → `POST /api/project/:id` with `{ prompt }`.

Server loads the project **including frames**, then sends:

```ts
{ userId, projectId, prompt, frames: project.frames, theme: project.theme }
```

The worker treats this as `isExistingGeneration`: it concatenates up to 4 existing `htmlContent` strings into the analysis prompt and **keeps** `existingTHeme` instead of the model’s theme.

`CanvasProvider` on `analysis.complete` **appends** skeleton frames to the existing list (`setFrames(prev => [...prev, ...skeletonFrames])`).

### 4.4 Theme change

Theme picker only updates **local** `themeId` in `CanvasProvider`. That immediately re-wraps every iframe with new CSS variables (`getHTMLWrapper(..., themeStyle)`).

The Save button (`useUpdateProject`) `PATCH`es `{ themeId }` so the next page load and follow-up generations use it. Until Save, the DB still has the old theme.

### 4.5 Screenshot / thumbnail

Two consumers of `POST /api/screenshot`:

| Caller | Body | Response |
|---|---|---|
| DeviceFrame “download PNG” | `{ html: full wrapped document, width, height }` **no projectId** | `image/png` blob |
| Canvas “camera” | Serialized **outer canvas DOM** + inlined `document.styleSheets` | PNG blob download |
| Auto after `loadingStatus === "completed"` | Same as camera **plus `projectId`** | JSON `{ base64 }`; also writes `Project.thumbnail` as `data:image/png;base64,...` |

On Vercel, Chromium is downloaded from a tar (`VERCEL_PROJECT_PRODUCTION_URL/chromium-pack.tar` or a GitHub fallback). Path is memoized on the serverless instance.

---

## 5. Data model

Prisma schema: `prisma/schema.prisma`  
Client: `lib/primsa.ts` (filename is misspelled; imports use `@/lib/primsa`)  
Generated client output: `lib/generated/prisma`

```prisma
model Project {
  id        String   @id @default(cuid())
  userId    String                 // Kinde user id, not a User table
  name      String                 // LLM short name or "Untitled Project."
  theme     String?                // THEME_LIST id
  thumbnail String?                // data-URL PNG, can be large
  frames    Frame[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Frame {
  id          String   @id @default(cuid())
  title       String
  htmlContent String               // inner HTML only
  projectId   String
  project     Project  @relation(..., onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

There is **no User table**. Authorization is “does `userId` equal the Kinde session id?” on every query.

`GET /api/project` returns the **10 most recent** projects for the user (no frames). Landing cards use `thumbnail` + `name` + `createdAt`.

Prisma 7 uses `prisma.config.ts` for the datasource URL (`env("DATABASE_URL")`) and `@prisma/adapter-pg` at runtime. `postinstall` runs `prisma generate`.

---

## 6. Authentication and routing

### 6.1 Kinde

- Browser: `useKindeBrowserClient()`, `LoginLink`, `LogoutLink`
- Server: `getKindeServerSession().getUser()`
- Routes: `app/api/auth/[kindeAuth]/route.ts` → `handleAuth()`

Required env vars are listed in `.env.example` (`KINDE_CLIENT_ID`, `KINDE_CLIENT_SECRET`, `KINDE_ISSUER_URL`, site/redirect URLs).

### 6.2 Gate: `proxy.ts`

```ts
withAuth(..., {
  isReturnToCurrentPage: true,
  publicPaths: ["/", "/api/inngest"],
})
```

Everything except `/` and the Inngest serve endpoint requires login. Project pages (`/project/:id`), screenshot, and project APIs are protected at the edge **and** re-checked in handlers.

`/api/inngest` must stay public so Inngest Cloud can invoke your functions (signed with `INNGEST_SIGNING_KEY`).

### 6.3 App Router map

| Path | File | Role |
|---|---|---|
| `/` | `app/(routes)/page.tsx` | Landing |
| `/project/[id]` | `app/(routes)/project/[id]/page.tsx` | Canvas (client page) |
| Root layout | `app/layout.tsx` | Font, QueryProvider, ThemeProvider |
| Route group layout | `app/(routes)/layout.tsx` | Thin `<main>` wrapper |

There is no dashboard route beyond home + project canvas.

---

## 7. Frontend architecture

### 7.1 Providers

```text
RootLayout
  QueryProvider          // TanStack QueryClient (empty default options)
    ThemeProvider        // next-themes, class strategy, default light
      children
        Project page
          CanvasProvider // frames, theme, selection, Inngest subscription
            Canvas
```

`CanvasProvider` is **not** global. Only the project page wraps with it. `useCanvas()` throws if used outside.

**Reset on project change:** it uses the “adjust state during render” pattern (`if (projectId !== prevProjectId) { setFrames(...) }`) so navigating between projects does not leak frames.

### 7.2 Realtime → UI mapping

Subscription token (`app/action/realtime.ts`) allows topics:

- `generation.start`
- `analysis.start`
- `analysis.complete`
- `frame.created`  ← **this is what the UI listens for**
- `generation.complete`

Handler in `CanvasProvider`:

| Topic | UI effect |
|---|---|
| `generation.start` | `loadingStatus = running` |
| `analysis.start` | `analyzing` |
| `analysis.complete` | `generating`; set theme; append **skeleton** frames (`id = screen.id`, `isLoading: true`, empty html) |
| `frame.created` | Replace skeleton whose `id === data.screenId` with the DB frame (`id` is now a cuid) |
| `generation.complete` | `completed`, then after 1s `idle` |

Messages for **other** `projectId`s are ignored (same user can theoretically have two tabs).

Loader colors on the canvas: gray fetching, amber running, blue analyzing, purple generating.

### 7.3 Canvas interaction model

- **SELECT:** click a DeviceFrame to select it; drag to move; resize if selected. Panning of the board is disabled.
- **HAND:** board pans; frames cannot be dragged.

Frames are placed at `x = 100 + index * 480`, `y = 100`.

Each DeviceFrame:

1. Builds `fullHtml = getHTMLWrapper(html, title, themeStyle, frameId)`
2. Renders `<iframe srcDoc={fullHtml} sandbox="allow-scripts allows-same-origin" pointer-events: none>`
3. Listens for `postMessage` `{ type: 'FRAME_HEIGHT', frameId, height }` from a script inside the wrapper to grow height
4. Can download a PNG of **that iframe’s document**, or open `HtmlDialog` (code viewer via shiki `CodeBlock`) for the **currently selected** frame

There is a hard-coded **Demo Screen** DeviceFrame (`DEMO_HTML`) always on the canvas at `(1000, 100)` in addition to real frames.

### 7.4 HTML wrapper (`lib/frameWrapper.ts`)

This is the contract between generated fragments and the browser:

- Loads Google Fonts: JetBrains Mono, Playfair Display, Plus Jakarta Sans, Space Grotesk
- Loads **Tailwind CDN** and **Iconify**
- Injects `:root { BASE_VARIABLES + theme CSS }`
- Hides scrollbars globally
- Embeds a small script that posts `FRAME_HEIGHT` after 100ms and 500ms

Default theme if none is passed: **Ocean Breeze**.

Generated HTML is instructed to use Iconify as `<iconify-icon icon="lucide:NAME">` and Tailwind v3 utilities. Color must go through CSS variables (`bg-[var(--background)]`, etc.) so theme swaps restyle without regenerating HTML.

### 7.5 Client hooks

`features/use-project.ts`

- `useCreateProject` — POST `/api/project`, navigate on success
- `useGetProjects(userId)` — GET list, enabled when `userId` is truthy

`features/user-project-id.ts`

- `useGetProjectById`
- `useGenerateDesignById` — extra screens
- `useUpdateProject` — persist theme

---

## 8. AI prompts and tools

### 8.1 Naming

`app/action/action.ts` → `generateProjectName`: Gemini, “under 5 words”, fallback `"Untitled Project."`

### 8.2 Analysis (`ANALYSIS_PROMPT` in `lib/prompt.ts`)

Role: Lead mobile UI designer. Outputs JSON matching `AnalysisSchema`.

Instructs:

- Prefer starting with a welcome/onboarding screen
- Dense `visualDescription` (layout, real data, lucide icon names, bottom nav rules)
- Pick a theme from `THEME_LIST`
- No bottom nav on splash/auth screens
- If existing HTML context is present, match those screens

**Conflict:** prose says “if user asked for one screen, return 1” and “default 1–4”, but Zod is `.min(3).max(4)`. The schema is what `generateObject` enforces.

### 8.3 Generation (`GENERATION_SYSTEM_PROMPT`)

Role: “Dribbble-quality” HTML. Hard rules:

- Raw HTML starting with `<div`
- No JS, no canvas, charts = SVG only
- Avatars: `https://i.pravatar.cc/150?u=NAME`
- Other images: Unsplash tool only
- Do not redeclare CSS variables (parent wrapper owns them)
- Glass, glow, rounded-2xl/3xl aesthetic
- Bottom nav pattern documented in the prompt

Per-screen user prompt also repeats iframe-friendly layout rules (root overflow, `h-screen` vs `min-h-screen`, scrollbar hiding).

### 8.4 Unsplash tool

```ts
GET https://api.unsplash.com/search/photos?query=...&orientation=...&per_page=1
  &client_id=UNSPLASH_ACCESS_KEY
```

Returns `results[0].urls.regular` or `""`. The model is expected to put that URL in an `<img>`.

---

## 9. Themes

All themes are **data**, not CSS files. Each entry:

```ts
{ id: string, name: string, style: string /* CSS custom properties */ }
```

Shared `BASE_VARIABLES`: font family names + shadow + tracking tokens.

`parseThemeColors(style)` regex-parses `--token: value` for the swatches in the toolbar.

There are **21** themes in `THEME_LIST` (ocean-breeze, netflix, acid-lime, purple-yellow, green-lime, teal-coral, lilac-teal, orange-gray, neo-brutalism, glassmorphism, swiss-style, sunset, ocean, forest, lavender, monochrome, neon, midnight, peach, glacier, rose-gold, cyber).

Changing theme in the UI is **instant for iframes** because `themeStyle` is a dependency of `getHTMLWrapper`. It does **not** rewrite stored HTML.

---

## 10. How to run and deploy

### Local

1. PostgreSQL + `.env` from `.env.example` (use a **Postgres** `DATABASE_URL`, not Mongo)
2. `bun install` or `npm install` (runs `prisma generate`)
3. `npx prisma migrate deploy` (or `migrate dev`) against that database
4. `npm run dev` → http://localhost:3000
5. Inngest: you need the Inngest Dev Server (or Cloud) hitting `/api/inngest`. `inngest-cli` is a devDependency. If events are sent but screens never appear, Inngest is not connected.

Kinde, OpenRouter, Unsplash keys are required for a full loop. Screenshot works locally via full `puppeteer`.

### Production (Vercel)

- `vercel.json` sets `maxDuration: 60` on `app/api/**/route.ts` (generation and screenshots are slow)
- `next.config.ts` marks `@sparticuz/chromium-min` as `serverExternalPackages`
- Set `INNGEST_SIGNING_KEY` / `INNGEST_EVENT_KEY` for Inngest Cloud
- `INNGEST` client currently forces `isDev: false`

`GET /api/debug-inngest` returns whether a signing key is present and its first 12 characters — useful, but it is an unauthenticated info leak of key prefix if the proxy ever allows it (it does not; not in `publicPaths`).

---

## 11. Inconsistencies and traps (read before changing code)

These are real in the current tree. Treat them as part of understanding, not as a punch list you must fix.

1. **Realtime topic typo:** worker publishes `frame.craeted`; UI and token subscribe to `frame.created`. Live frame replacement can fail; reload after job completion still loads frames from GET.

2. **`.env.example` vs Prisma:** example URL is MongoDB; schema and adapter are PostgreSQL.

3. **README vs Prisma comments:** README still says “created in PostgreSQL” in one place and Mongo in the env sample.

4. **Analysis prompt vs Zod:** 1 screen vs min 3.

5. **`CanvasFloatingToolbar` generate guard:** `if (!prompt) return` — `prompt` is not in scope; it should be `promptText`. Empty submits can still fire.

6. **`saveThumbnailToProject` never clears `isSaving`:** `finally` sets `isScreenshotting`, not `isSaving`. After auto-thumbnail, the canvas loader can stick on “fetching”.

7. **Iframe sandbox typo:** `allow-scripts allows-same-origin` (extra `s`). `allow-same-origin` may not be applied; `postMessage` from srcDoc often still works.

8. **Prisma filename:** `lib/primsa.ts`.

9. **Demo frame** always present on the canvas; easy to confuse with generated output.

10. **Thumbnails in DB as data-URLs** will bloat rows; listing 10 projects pulls those strings.

11. **Inngest send failures are swallowed** in both POST handlers (`try/catch` log only). The API still returns `success: true` and the UI navigates to an empty generating canvas.

12. **GET project vs GET list response shapes differ:** list wraps `{ success, data }`; detail returns the project object at the root. Hooks already account for this.

13. **DeviceFrameSkeleton transform** in Canvas uses invalid CSS: `` `translate${baseX}px 100px` `` (missing `(`). Skeletons may not sit where real frames will.

---

## 12. File index

### App / API

| File | Why it exists |
|---|---|
| `app/layout.tsx` | Root providers, metadata, Jost |
| `app/(routes)/page.tsx` | Home |
| `app/(routes)/project/[id]/page.tsx` | Loads project, mounts CanvasProvider + Canvas |
| `app/(routes)/project/[id]/_common/Header.tsx` | Back + project name + theme toggle |
| `app/api/project/route.ts` | List + create + kick Inngest |
| `app/api/project/[id]/route.ts` | Get / generate more / patch theme |
| `app/api/screenshot/route.ts` | Puppeteer PNG |
| `app/api/inngest/route.ts` | Serves `generateScreen` |
| `app/api/auth/[kindeAuth]/route.ts` | Kinde |
| `app/api/debug-inngest/route.ts` | Signing key presence |
| `app/action/action.ts` | Project name LLM |
| `app/action/realtime.ts` | Realtime JWT for the browser |
| `proxy.ts` | Auth middleware |

### Generation

| File | Why it exists |
|---|---|
| `inngest/client.ts` | Inngest app `my-app` + realtime middleware |
| `inngest/functions/generateScreen.ts` | The pipeline |
| `inngest/functions/tool.ts` | Unsplash |
| `lib/prompt.ts` | System prompts |
| `lib/openrouter.ts` | Provider singleton |
| `lib/frameWrapper.ts` | iframe document factory |
| `lib/primsa.ts` | Prisma singleton |

### Canvas / product UI

| File | Why it exists |
|---|---|
| `context/CanvasProvider.tsx` | Generation UX state machine |
| `context/QueryProvider.tsx` | React Query |
| `components/canvas/Canvas.tsx` | Board, zoom, screenshot, loader |
| `components/canvas/DeviceFrame.tsx` | Draggable iframe phone |
| `components/canvas/DeviceFrameToolbar.tsx` | Per-frame actions |
| `components/canvas/DeviceFrameSkeleton.tsx` | Loading placeholder |
| `components/canvas/CanvasFloatingToolbar.tsx` | Generate / theme / save / camera |
| `components/canvas/CanvasControls.tsx` | Zoom + select/hand |
| `components/canvas/ThemeSelector.tsx` | Full theme list |
| `components/canvas/HtmlDialog.tsx` | View source of a frame |
| `components/PromptInput.tsx` | Shared textarea + Design button |
| `components/_common/LandingSection.tsx` | Marketing + recents |
| `components/_common/Header.tsx` | Landing header + auth |
| `features/use-project.ts` | Home mutations/queries |
| `features/user-project-id.ts` | Project-page mutations/queries |
| `types/project.ts` | `ProjectType` / `FrameType` (`isLoading` is client-only) |
| `types/themes.ts` | All theme CSS + `THEME_LIST` |
| `constants/canvas.ts` | `SELECT` / `HAND` |

### Config

`package.json`, `prisma/schema.prisma`, `prisma.config.ts`, `prisma/migrations/`, `next.config.ts`, `vercel.json`, `components.json` (shadcn), `tsconfig.json`, `.env.example`.

---

## 13. Suggested reading order (to actually internalize it)

1. This guide’s [mental model](#2-mental-model) and [request flow](#4-how-a-request-actually-flows).
2. `prisma/schema.prisma` — two tables, that’s the whole domain.
3. `app/api/project/route.ts` then `app/api/project/[id]/route.ts` — the HTTP surface.
4. `inngest/functions/generateScreen.ts` **in full** — every product decision lives here.
5. `lib/prompt.ts` — why screens look the way they do.
6. `lib/frameWrapper.ts` + `types/themes.ts` — how HTML becomes a themed phone.
7. `context/CanvasProvider.tsx` — how jobs become pixels.
8. `components/canvas/Canvas.tsx` + `DeviceFrame.tsx` — interaction and iframe contract.
9. `app/api/screenshot/route.ts` — thumbnails and export.
10. `proxy.ts` + Kinde usage — who is allowed to do what.

Then generate one project locally with Inngest Dev Server running and watch: DB rows, Inngest step traces, and the canvas loader states. That closes the loop faster than any extra diagram.

---

## 14. How to extend it safely

| You want to… | Touch |
|---|---|
| Change how many screens are generated | `AnalysisSchema` **and** `ANALYSIS_PROMPT` together |
| Change visual style of new screens | `GENERATION_SYSTEM_PROMPT` (+ maybe wrapper fonts) |
| Add a theme | New CSS string + `THEME_LIST` entry; ids must stay stable (they are stored on Project) |
| Add a new AI tool (e.g. icons) | `inngest/functions/tool.ts` + register on `generateText({ tools })` |
| Persist frame positions / sizes | New columns on `Frame`; DeviceFrame currently does not save layout |
| Multi-user collaboration | Today everything is keyed by `userId` + Inngest channel `user:{id}` |
| Swap models | `openrouter.chat("...")` in generateScreen + generateProjectName |
| Fix live updates | Align publish topic with `frame.created` |

**Do not** put long LLM work in the Next.js POST handler. The current split exists so the user can land on the canvas immediately. Keep new generation work inside Inngest `step.run` so retries do not double-create frames blindly (today there is no idempotency key on frame create — retries can duplicate screens).

---

## 15. Glossary

| Term | Meaning here |
|---|---|
| **Screen / Frame** | One mobile UI mock, stored as HTML |
| **Project** | A named set of frames for one user |
| **Wrapper** | Full HTML document around a frame fragment |
| **Theme id** | Key into `THEME_LIST`, stored on Project |
| **Skeleton frame** | Client-only placeholder with planned `screen.id` before the DB row exists |
| **Channel** | Inngest realtime `user:{kindeUserId}` |
| **OpenRouter** | Gateway; the model behind it is Gemini 2.5 Flash Lite |
| **srcDoc** | iframe content supplied as a string, not a URL |
