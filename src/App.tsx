import { Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WindowChrome } from "./components/chrome/WindowChrome";
import { SettingsModal } from "./components/settings/SettingsModal";
import { TaskDetailCard } from "./components/task/TaskDetailCard";
import { TaskList } from "./components/task/TaskList";
import { ToastContainer } from "./components/toast/ToastContainer";
import { ViewSwitcher } from "./components/view/ViewSwitcher";
import { VoiceWidget } from "./components/voice/VoiceWidget";
import { useVoiceCapture } from "./hooks/useVoiceCapture";
import { initTheme } from "./stores/themeStore";
import { hydrateTaskStore, useVisibleTasks } from "./stores/taskStore";

function App() {
  const { openTasks, doneTasks } = useVisibleTasks();
  const { startRecording, toggleRecording, voiceMessage, voiceState } = useVoiceCapture();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);

  const detailTask = useMemo(() => {
    if (!detailTaskId) return null;
    return openTasks.find((t) => t.id === detailTaskId) ?? doneTasks.find((t) => t.id === detailTaskId) ?? null;
  }, [detailTaskId, openTasks, doneTasks]);

  useEffect(() => {
    void hydrateTaskStore();
    initTheme();
    const window = getCurrentWindow();
    const closePromise = window.onCloseRequested(async (event) => {
      event.preventDefault();
      await window.hide();
    });
    const shortcutPromise = listen("voice-shortcut", () => {
      void startRecording();
    });
    const tasksUpdatedPromise = listen("tasks-updated", () => {
      void hydrateTaskStore();
    });

    return () => {
      void closePromise.then((unlisten) => unlisten());
      void shortcutPromise.then((unlisten) => unlisten());
      void tasksUpdatedPromise.then((unlisten) => unlisten());
    };
  }, [startRecording]);

  return (
    <>
      <main className="app-shell">
        <section className="task-panel">
          <WindowChrome />

          <div className="content-column">
            <header className="list-header">
              <ViewSwitcher />
              <div className="header-actions">
                <button
                  aria-label="Settings"
                  className="icon-button"
                  onClick={() => setSettingsOpen(true)}
                  type="button"
                >
                  <Settings size={18} />
                </button>
              </div>
            </header>

            <TaskList
              doneTasks={doneTasks}
              onSelectTask={(id) => setDetailTaskId(id)}
              openTasks={openTasks}
            />
          </div>
        </section>
        <VoiceWidget message={voiceMessage} state={voiceState} onToggle={toggleRecording} />
      </main>

      <ToastContainer />

      {settingsOpen ? <SettingsModal onClose={() => setSettingsOpen(false)} /> : null}

      {detailTask ? (
        <TaskDetailCard onClose={() => setDetailTaskId(null)} task={detailTask} />
      ) : null}
    </>
  );
}

export default App;
