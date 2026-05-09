# todoless

> Voice-first tasks. Speak once, get structured tasks.

todoless is a voice-native task app focused on one core experience: hold a shortcut, say what is on your mind, and turn that speech into structured tasks with dates, priorities, and tags. It is intentionally not a notes app, journal, calendar suite, or project-management system.

## Current Status

As of 2026-05-09, the repository is a Bun workspace with three apps and one shared package:

| Package | Path | Status | Purpose |
|---|---|---|---|
| Desktop | `apps/desktop` | Active MVP | Tauri Windows app with main window, widget, SQLite, voice pipeline, settings |
| Mobile | `apps/app` | Early implementation | Expo SDK 54 app for mobile task viewing/capture |
| Web | `apps/web` | Active landing app | Next.js marketing site, demo, pricing, download, waitlist |
| Shared | `packages/shared` | Active | Shared task types, date/id helpers, design tokens |

## Product Principles

- Voice is primary; typing is secondary.
- One utterance can create up to 10 tasks.
- No confirmation step by default. The app should create tasks directly, then make correction/editing fast.
- Tasks are local-first today. Cloud sync is a future option, not an MVP dependency.
- The UI should stay close to a minimal task widget: view switcher, list, task detail, voice button, settings.
- Do not expand into journal, notes, team collaboration, OKR, habits, or complex calendar workflows.

## Desktop App

The desktop app is the main product surface.

Key capabilities:

- Tauri v2 custom frameless window.
- Main task panel and compact floating widget.
- Global press-to-talk shortcut, default `Ctrl+Shift+Space`.
- Local SQLite storage through `@tauri-apps/plugin-sql`.
- Soft delete and event logging for future learning.
- Tags stored in a separate table and linked through `task_tags`.
- OpenRouter ASR using `openai/whisper-large-v3-turbo` by default.
- OpenRouter task planning using `deepseek/deepseek-v4-flash` by default.
- Optional SenseVoice Small model download flow for future local ASR.
- Settings for theme, always-on-top behavior, shortcut, close behavior, remote/local voice model.

Desktop commands:

```bash
bun run dev:desktop
bun run check:desktop
bun run build:desktop
```

Desktop environment:

Create `apps/desktop/.env.local`:

```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_ASR_MODEL=openai/whisper-large-v3-turbo
OPENROUTER_TEXT_MODEL=deepseek/deepseek-v4-flash
```

Only `OPENROUTER_API_KEY` is required. Model values have defaults.

## Mobile App

The mobile app lives in `apps/app` and uses Expo SDK 54, React Native 0.81, Expo Router 6, Expo SQLite, Zustand, and shared task helpers from `packages/shared`.

Current intent:

- Mobile-friendly Today / Inbox / Settings surfaces.
- Local task storage first.
- Shared task model with desktop.
- Voice-first mobile capture that inherits the desktop philosophy: one primary mic action, task list second, typing as fallback.
- Future sync can be added without changing the task domain model.

Current engineering notes:

- The workspace is Bun-only. `pnpm` files were removed.
- `bunfig.toml` uses the hoisted linker because Expo/React Native 0.81 expects a conventional `node_modules` layout.
- `postinstall` runs `scripts/patch-react-native-bun.mjs` to patch missing React Native files in Bun's `.bun` package mirror on Windows.
- Android production export has been verified after the Expo 54 migration.
- Avoid runtime use of `react-native-reanimated` / worklets until the native runtime is explicitly configured; current mobile interactions use plain React Native primitives.

Run:

```bash
bun run dev:app
```

If the Bun script is blocked by the local shell sandbox, run Expo directly:

```bash
cd apps/app
node node_modules/expo/bin/cli start --offline --clear
```

## Web App

The web app lives in `apps/web` and is the public product surface.

Current pages:

- `/` landing page
- `/demo`
- `/pricing`
- `/download`
- `/api/waitlist`

Run:

```bash
bun run dev:web
bun run build:web
```

## Shared Package

`packages/shared` exports:

- Task and agent types.
- Date helpers for Today / Tomorrow / Next 7 Days / Inbox.
- ID helpers.
- Design tokens.
- Placeholder sync protocol exports.

Use shared code for cross-platform behavior whenever possible. Avoid duplicating task filtering or schema logic separately in desktop and mobile.

## Voice Pipeline

```text
Press shortcut
  -> record audio locally with MediaRecorder
  -> release shortcut
  -> transcribe audio through selected ASR model
  -> plan tasks through selected text model
  -> validate structured JSON
  -> write tasks/tags/events to SQLite
  -> refresh main window and widget
```

Default task planning rules:

- Maximum 10 tasks per voice input.
- If no date/time is mentioned, default due date is today at the hidden default due time, currently `22:00`.
- If a date is mentioned without time, due time uses the default due time and reminder defaults to `09:00`.
- Priority is inferred from urgency, consequence, and wording.
- Tags are coarse and AI-generated.
- `content` stays null unless the speech contains useful execution context.

## Workspace Commands

```bash
bun install
bun run dev:desktop
bun run dev:app
bun run dev:web
```

Root scripts delegate into the relevant workspace package.

## Known Product/Engineering Notes

- Desktop is the source of truth for the MVP experience.
- Mobile is present but still early and should stay simple.
- Local SenseVoice download is implemented as model management, but full local ASR execution still depends on the sidecar integration.
- Cloud sync is intentionally out of MVP scope.
- Settings UI should keep using shared primitives where possible: `DropdownMenu`, `SelectMenu`, shared task parts, scroll visibility hook, dismissable layer hook.

## License

Private.
