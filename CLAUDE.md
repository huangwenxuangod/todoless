# todoless

A voice-first, AI-powered desktop task manager built with Tauri v2 and React.

## Overview

todoless is a minimal desktop application that turns spoken words into structured tasks. It features a warm, low-contrast "Zen Voice" design language, two window modes (main panel + floating widget), and a fully local SQLite database. The core interaction is simple: press a global shortcut, speak, and watch tasks appear.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Tauri v2 (Rust) |
| Frontend | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Validation | Zod |
| Database | SQLite via `@tauri-apps/plugin-sql` |
| State | Custom stores with `useSyncExternalStore` |

## Architecture

### Window Model

The app runs two Tauri webview windows from a single React entry point (`main.tsx` branches on `?mode=widget`):

- **Main Window** (`label: "main"`, 620 x 760): Primary task panel with full chrome, view switcher, task list, settings, and voice widget.
- **Widget Window** (`label: "widget"`, 370 x 300): Compact always-on-top floating panel. Transparent background, no taskbar entry. Mirrors main app functionality in minimal form.

Both windows respond to the same global voice shortcut events (`voice-shortcut` / `voice-shortcut-release`).

### State Management

All global state lives outside React in module-level atoms, exposed via `useSyncExternalStore`. No context providers, no Redux.

| Store | File | Responsibility |
|-------|------|---------------|
| taskStore | `src/stores/taskStore.ts` | Tasks, tags, active view/filter, recent context |
| settingsStore | `src/stores/settingsStore.ts` | Always-on-top, shortcut, close behavior, ASR/text model |
| themeStore | `src/stores/themeStore.ts` | Light / dark / system mode, `html.light` class toggle |
| toastStore | `src/stores/toastStore.ts` | Ephemeral toast queue, auto-dismiss after 3s |

Stores emit changes by iterating a `Set<() => void>` of listeners. Server-side rendering is not a concern (desktop-only app), so `getSnapshot` and `getServerSnapshot` are identical.

### Voice Pipeline

```
User presses Ctrl+Shift+Space
    -> MediaRecorder captures audio (webm/opus)
    -> Stop recording -> Blob created
    -> transcribeAudio() -> Tauri invoke -> OpenRouter /v1/audio/transcriptions (Whisper)
    -> planTasksFromTranscript() -> Tauri invoke -> OpenRouter /v1/chat/completions (DeepSeek V4 Flash)
    -> Zod validation (AgentCreateTasksSchema)
    -> createTasksFromAgent() -> SQLite INSERT
    -> Emit "tasks-updated" event -> Both windows rehydrate
```

The LLM is given a strict system prompt that returns only JSON. It infers due dates, reminders, priorities, and tags from natural speech. Recent task titles are included as context to improve coherence.

### Local ASR (Optional)

Users can download a local SenseVoice Small ONNX model (~229 MB) for offline transcription. Model files are fetched from ModelScope or Hugging Face and stored in `models/sensevoice-small/`. Progress is streamed via Tauri events.

### Database Schema

SQLite via `todoless.db`:

- **tasks**: id, title, content, status, due_at, reminder_at, priority, created_at, updated_at, completed_at, deleted_at
- **tags**: id, name, color, created_at, updated_at
- **task_tags**: task_id, tag_id (junction)
- **events**: id, type, payload_json, created_at (audit log)
- **recent_context**: id, task_id, title_snapshot, created_at (sliding window of last 10 task titles)

All deletes are soft (set `deleted_at`). Tags auto-generate colors via string hash if not specified.

## Design System

### Philosophy

Dark-first, warm, minimal. The palette intentionally avoids cold grays and saturated accent colors. Inspired by paper, candlelight, and quiet interfaces.

### Tokens

CSS custom properties in `src/styles.css`. Dark values are `:root` defaults; `html.light` overrides them.

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

- No CSS Modules; all styles live in `src/styles.css`.
- Tailwind is used sparingly for utility classes; most layout is hand-written CSS leveraging custom properties.
- `framer-motion` `layout` prop is used on task items for smooth list reordering.
- Frameless windows use `-webkit-app-region: drag` / `no-drag` for chrome drag areas.

## Key Files

| File | Responsibility |
|------|---------------|
| `src/main.tsx` | Entry point. Renders `App` or `WidgetApp` based on URL param. |
| `src/App.tsx` | Main window layout. Orchestrates chrome, task list, voice widget, settings, detail card, toasts. |
| `src/WidgetApp.tsx` | Widget window. Compact view switcher, scrollable task list, floating voice button, context menu. |
| `src/styles.css` | Global design system. All CSS variables, component styles, scrollbar behavior, responsive rules. |
| `src/stores/taskStore.ts` | Task state, filtering logic, CRUD actions. |
| `src/stores/settingsStore.ts` | Settings persistence, Tauri window integration. |
| `src/hooks/useVoiceCapture.ts` | Full voice lifecycle: recording -> transcribing -> planning -> saved/error. |
| `src/services/voiceAgent.ts` | Frontend abstraction over `transcribe_audio` and `plan_tasks` Tauri commands. |
| `src/services/db.ts` | SQLite schema, migrations, CRUD, seeding. |
| `src-tauri/src/lib.rs` | Rust backend: OpenRouter API calls, SenseVoice download, global shortcuts, tray menu, window commands. |
| `src-tauri/tauri.conf.json` | Window definitions, build hooks, security policy. |

## Environment

Create `.env.local` at project root:

```
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_ASR_MODEL=openai/whisper-large-v3-turbo
OPENROUTER_TEXT_MODEL=deepseek/deepseek-v4-flash
```

Only `OPENROUTER_API_KEY` is required. The others fall back to sensible defaults in Rust.

## Development

```bash
# Install dependencies
bun install

# Run dev server (Vite + Tauri)
bun run tauri:dev

# Type check
bun run check

# Build release
bun run tauri:build
```

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

## AI Task Parsing Rules

The system prompt sent to DeepSeek V4 Flash enforces:

- Up to 10 tasks per transcript.
- `priority`: 3 = urgent/high consequence, 2 = important/soon, 1 = normal, 0 = low pressure.
- When no time is mentioned: `dueAt` = today at default due time (22:00), `reminderAt` = null.
- When date but no time: `dueAt` = that date at default due time, `reminderAt` = that date at 09:00.
- `content` is omitted (null) for short tasks; used only when extra execution context is needed.
- Tags are coarse-grained strings derived from task subject.

## License

Private / unlicensed.
