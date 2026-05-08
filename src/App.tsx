import { MoreHorizontal } from "lucide-react";
import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WindowChrome } from "./components/chrome/WindowChrome";
import { TaskList } from "./components/task/TaskList";
import { ViewSwitcher } from "./components/view/ViewSwitcher";
import { VoiceWidget } from "./components/voice/VoiceWidget";
import { useVoiceCapture } from "./hooks/useVoiceCapture";
import { hydrateTaskStore, useTaskStore, useVisibleTasks } from "./stores/taskStore";

function App() {
  const store = useTaskStore();
  const { openTasks, doneTasks } = useVisibleTasks();
  const { startRecording, toggleRecording, voiceMessage, voiceState } = useVoiceCapture();

  useEffect(() => {
    void hydrateTaskStore();
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
    <main className="app-shell">
      <section className="task-panel">
        <WindowChrome />

        <div className="content-column">
          <header className="list-header">
            <ViewSwitcher />
            <div className="header-actions">
              <button aria-label="More options" className="icon-button" type="button">
                <MoreHorizontal size={24} />
              </button>
            </div>
          </header>

          {store.error ? <div className="store-error">{store.error}</div> : null}

          <TaskList doneTasks={doneTasks} openTasks={openTasks} />
        </div>
      </section>
      <VoiceWidget message={voiceMessage} state={voiceState} onToggle={toggleRecording} />
    </main>
  );
}

export default App;
