# todoless

A voice-first task product built as a Bun-only workspace.

## Overview

todoless turns spoken words into structured tasks. The desktop app remains the MVP source of truth, while mobile and web are now present as separate workspace apps. The product should stay narrowly focused on voice-to-task: not notes, not journaling, not team project management.

## Workspace Layout

| Path | Role |
|------|------|
| `apps/desktop` | Tauri + React desktop app, main MVP surface |
| `apps/app` | Expo mobile app, early implementation with local tasks, voice capture, notifications, and sync helpers |
| `apps/web` | Next.js landing/waitlist/download/pricing app with a Resend-backed waitlist route |
| `packages/shared` | Shared task types, date/id helpers, tokens |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Tauri v2 (Rust), under `apps/desktop` |
| Desktop Frontend | React 19 + TypeScript + Vite |
| Mobile | Expo SDK 54 + React Native 0.81 + Expo Router 6 + Expo SQLite |
| Web | Next.js |
| Styling | Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Validation | Zod |
| Desktop Database | SQLite via `@tauri-apps/plugin-sql` |
| Mobile Database | Expo SQLite |
| Desktop State | Custom stores with `useSyncExternalStore` |
| Mobile State | Zustand |

## Package Manager Rules

- Use Bun only. Do not reintroduce `pnpm-lock.yaml` or `pnpm-workspace.yaml`.
- `bunfig.toml` intentionally sets `linker = "hoisted"` because Expo / React Native 0.81 expects a conventional root `node_modules` layout.
- Root `postinstall` runs `scripts/patch-react-native-bun.mjs`. Keep this script unless Bun's React Native package layout no longer needs patching on Windows.
- After dependency changes that touch Expo / React Native, run the patch script through `bun install` before testing mobile.

## Architecture

### Window Model

The desktop app runs two Tauri webview windows from `apps/desktop/src/main.tsx` (`?mode=widget` selects the widget):

- **Main Window** (`label: "main"`, 620 x 760): Primary task panel with full chrome, view switcher, task list, settings, and voice widget.
- **Widget Window** (`label: "widget"`, 370 x 300): Compact always-on-top floating panel. Transparent background, no taskbar entry. Mirrors main app functionality in minimal form.

Both windows respond to the same global voice shortcut events (`voice-shortcut` / `voice-shortcut-release`).

### State Management

Desktop global state lives outside React in module-level atoms, exposed via `useSyncExternalStore`. Mobile uses Zustand.

| Store | File | Responsibility |
|-------|------|---------------|
| taskStore | `apps/desktop/src/stores/taskStore.ts` | Tasks, tags, active view/filter, recent context |
| settingsStore | `apps/desktop/src/stores/settingsStore.ts` | Always-on-top, shortcut, close behavior, ASR/text model |
| themeStore | `apps/desktop/src/stores/themeStore.ts` | Light / dark / system mode, `html.light` class toggle |
| toastStore | `apps/desktop/src/stores/toastStore.ts` | Ephemeral toast queue, auto-dismiss after 3s |

Stores emit changes by iterating a `Set<() => void>` of listeners. Server-side rendering is not a concern (desktop-only app), so `getSnapshot` and `getServerSnapshot` are identical.

### Voice Pipeline

```
User presses Ctrl+Shift+Space
    -> MediaRecorder captures audio (webm/opus)
    -> Stop recording -> Blob created
    -> transcribeAudio() -> Tauri invoke -> OpenRouter /v1/audio/transcriptions (Whisper)
    -> planTasksFromTranscript() -> Tauri invoke -> OpenRouter /v1/chat/completions (Kimi K2.6 primary, fallback chain on retryable failures)
    -> Zod validation (AgentCommandSchema)
    -> executeAgentCommand() -> SQLite INSERT/UPDATE/soft delete/reminder/repeat operation
    -> Emit "tasks-updated" event -> Both windows rehydrate
```

The LLM is given a strict system prompt that returns only JSON. It infers due dates, reminders, priorities, repeat rules, tags, and command targets from natural speech. Recent task titles are included as context to improve coherence.

### Local ASR (Optional)

Users can download a local SenseVoice Small ONNX model (~229 MB). Model management exists; full local ASR execution still requires the sidecar integration. Model files are fetched from ModelScope or Hugging Face and stored in `apps/desktop/models/sensevoice-small/` during desktop development. Progress is streamed via Tauri events.

### Database Schema

SQLite via `todoless.db`:

- **tasks**: id, title, content, status, due_at, reminder_at, priority, repeat_rule, created_at, updated_at, completed_at, deleted_at
- **tags**: id, name, color, created_at, updated_at
- **task_tags**: task_id, tag_id (junction)
- **events**: id, type, payload_json, created_at (audit log)
- **recent_context**: id, task_id, title_snapshot, created_at (sliding window of last 10 task titles)

All deletes are soft (set `deleted_at`). Tags auto-generate colors via string hash if not specified.

## Design System

### Philosophy

Dark-first, warm, minimal. The palette intentionally avoids cold grays and saturated accent colors. Inspired by paper, candlelight, and quiet interfaces.

### Tokens

CSS custom properties in `apps/desktop/src/styles.css`. Dark values are `:root` defaults; `html.light` overrides them.

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--bg` | `#0e0d0b` | `#faf8f5` | Page background |
| `--panel` | `#12110f` | `#f5f3f0` | Card / panel surfaces |
| `--surface` | `#1a1917` | `#edeae5` | Elevated interactive surfaces |
| `--text` | `#f0ece4` | `#1e1c19` | Primary text |
| `--muted` | `#9c968a` | `#7a756d` | Secondary text |
| `--accent` | `#b8a99a` | `#8a7d6e` | Focus states, active indicators |
| `--priority-none` | `#5a5854` | `#b0aba3` | P0 checkbox ring |
| `--priority-low` | `#5a8ec2` | `#4a7eb2` | P1 checkbox ring |
| `--priority-medium` | `#c9a14d` | `#b8903a` | P2 checkbox ring |
| `--priority-high` | `#c45a5a` | `#b85050` | P3 checkbox ring |

### Typography

System font stack with Chinese support:
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI Variable",
  "HarmonyOS Sans SC", "MiSans", "Microsoft YaHei UI", sans-serif;
```

### Component Conventions

- No CSS Modules in desktop; all desktop styles live in `apps/desktop/src/styles.css`.
- Tailwind is used sparingly for utility classes; most layout is hand-written CSS leveraging custom properties.
- `framer-motion` `layout` prop is used on task items for smooth list reordering.
- Frameless windows use `-webkit-app-region: drag` / `no-drag` for chrome drag areas.
- Reuse UI primitives before adding one-off components: `DropdownMenu`, `SelectMenu`, `TaskParts`, `useScrollVisibility`, `useDismissableLayer`.

## Key Files

| File | Responsibility |
|------|---------------|
| `apps/desktop/src/main.tsx` | Desktop entry point. Renders `App` or `WidgetApp` based on URL param. |
| `apps/desktop/src/App.tsx` | Main window layout. Orchestrates chrome, task list, voice widget, settings, detail card, toasts. |
| `apps/desktop/src/WidgetApp.tsx` | Widget window. Compact view switcher, scrollable task list, floating voice button, context menu. |
| `apps/desktop/src/styles.css` | Desktop design system. CSS variables, component styles, scrollbar behavior, responsive rules. |
| `apps/desktop/src/stores/taskStore.ts` | Desktop task state, filtering logic, CRUD actions. |
| `apps/desktop/src/stores/settingsStore.ts` | Settings persistence, Tauri window integration. |
| `apps/desktop/src/hooks/useVoiceCapture.ts` | Full voice lifecycle: recording -> transcribing -> planning -> saved/error. |
| `apps/desktop/src/services/voiceAgent.ts` | Frontend abstraction over `transcribe_audio` and `plan_tasks` Tauri commands. |
| `apps/desktop/src/services/db.ts` | SQLite schema, migrations, CRUD, seeding. |
| `apps/desktop/src/services/sync.ts` | Supabase REST pull/push helper; currently gated by `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. |
| `apps/desktop/src-tauri/src/lib.rs` | Rust backend: OpenRouter API calls, SenseVoice download, global shortcuts, tray menu, window commands. |
| `packages/shared/src` | Shared types, date helpers, ids, tokens, sync payload types. |
| `apps/app/src` | Expo mobile app: local SQLite tasks, voice capture, reminder notifications, sync helpers. |
| `apps/web/src` | Next.js web app: landing, demo, pricing, download, Resend waitlist API. |

## Mobile App Notes

- Mobile is currently a local-first task-list companion, not a separate product branch.
- It must inherit desktop's Zen Voice philosophy: dark warm surfaces, circular priority checkbox, sparse task rows, and voice as the primary action.
- Keep the mobile scope to lists: Today / Tomorrow / Inbox / Tags, task detail, completion, and voice capture. Do not add notes, journals, complex calendar views, habits, team features, or chat UI.
- Repeat scope is intentionally tiny: users only choose `daily` or `weekly`; `none` is an internal state for ordinary tasks and should not be shown as a selectable repeat option. Completing a repeat task creates the next occurrence and preserves the completed task.
- Avoid `react-native-reanimated` / worklets in runtime code until the native runtime is verified. A previous runtime mismatch caused `installTurboModule` argument errors. Prefer plain React Native `Pressable`, `Animated`, and StyleSheet states for now.
- With Zustand on React Native, do not select derived arrays directly inside the selector, e.g. avoid `useTaskStore((s) => s.getOpenTasks())`. Select raw state and derive with `useMemo` to avoid `getSnapshot should be cached` infinite loops.
- Mobile voice capture currently uses `EXPO_PUBLIC_OPENROUTER_API_KEY` directly from Expo code. Treat this as an early-test path and move it behind secure storage or a backend before a public build.
- Mobile reminder notifications live in `apps/app/src/services/notifications.ts`, schedule at most 64 open future reminders, and expose Done / Later actions through Expo Notifications.
- Android export has been verified with:

```bash
cd apps/app
node node_modules/expo/bin/cli export --platform android --clear --output-dir .expo-export-test
```

## Environment

Create `apps/desktop/.env.local`:

```
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_ASR_MODEL=openai/whisper-large-v3-turbo
OPENROUTER_TEXT_MODEL=moonshotai/kimi-k2.6
OPENROUTER_TEXT_FALLBACK_MODELS=qwen/qwen3.6-flash,deepseek/deepseek-v4-flash
```

Only `OPENROUTER_API_KEY` is required. The others fall back to sensible defaults in Rust.

Create `apps/app/.env.local` for mobile voice/sync testing:

```
EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-...
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Only `EXPO_PUBLIC_OPENROUTER_API_KEY` is required for mobile voice capture. Supabase values enable the service helpers, but account UI and full sync orchestration are not yet wired into the product flow.

Create `apps/web/.env.local` for waitlist email:

```
RESEND_API_KEY=re_...
```

## Development

```bash
# Install dependencies
bun install

# Run desktop app
bun run dev:desktop

# Type check desktop
bun run check:desktop

# Build desktop release
bun run build:desktop

# Run mobile app
bun run dev:app

# Fallback direct Expo command
cd apps/app
node node_modules/expo/bin/cli start --offline --clear

# Run web app
bun run dev:web
```

## Desktop Packaging

- Windows-first release uses Tauri's NSIS target.
- Config lives in `apps/desktop/src-tauri/tauri.conf.json`.
- Build output should be uploaded from `apps/desktop/src-tauri/target/release/bundle/nsis/`.
- The download page should link to uploaded release assets, not local build paths.
- Do not switch back to `"targets": "all"` unless macOS/Linux packaging is actively being configured.

## Global Shortcut

Default: `Ctrl+Shift+Space`

- **Pressed** -> Starts recording in whichever window is focused (main or widget).
- **Released** -> Stops recording and begins transcription.

Shortcut is configurable in Settings > General.

## Tray Menu

Right-click the system tray icon:
- Show todoless -> Unhides main window
- Open Widget -> Unhides widget window
- Quit -> Exits app

Close button behavior (Settings > General):
- Hide to tray (default): Window hides, app stays alive in tray.
- Quit app: Fully exits.

## Smart Views

Tasks are filtered into views based on `dueAt`:

- **Today**: Due today
- **Tomorrow**: Due tomorrow
- **Next 7 Days**: Due within next 7 days
- **Inbox**: Tasks with no due date
- **All**: Everything except deleted

Tag filtering overrides view filtering. Selecting a tag shows all tasks (open + done) with that tag.

## Sync

Supabase migration lives at `supabase/migrations/20260509152000_initial_sync.sql`.

Current sync decisions:

- Local-first on desktop and mobile.
- Email magic-link auth.
- Login uploads existing local tasks as the intended first-sync behavior.
- Background sync is the intended behavior after sign-in, but current product UI only exposes a small sync affordance.
- Last Write Wins by `updated_at`.
- Soft deletes propagate through `deleted_at`.
- First cloud scope is `tasks`, `tags`, `task_tags`, and `sync_state`.
- Do not sync `events`, `recent_context`, or preference memory yet.
- Keep sync UI as a small icon/status affordance in the task surface. Do not build a complex account dashboard.
- Web does not expose a task UI yet.

## AI Task Parsing Rules

The system prompt sent to the OpenRouter task-planning model enforces:

- Up to 10 tasks per transcript.
- `priority`: 3 = urgent/high consequence, 2 = important/soon, 1 = normal, 0 = low pressure.
- When no time is mentioned: `dueAt` = today at default due time (22:00), `reminderAt` = null.
- When date but no time: `dueAt` = that date at default due time, `reminderAt` stays null unless the transcript explicitly asks for a reminder.
- When the transcript asks for a reminder without a precise time: same-day vague reminders default to 20:00; future-day vague reminders default to 09:00.
- `content` is omitted (null) for short tasks; used only when extra execution context is needed.
- Tags are coarse-grained strings derived from task subject.

## License

Private / unlicensed.
