import { Archive, Calendar1, CalendarDays, ChevronDown, ChevronRight, Inbox, Menu, Mic, MoreHorizontal, Plus, Tag, TimerReset } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WindowChrome } from "./components/chrome/WindowChrome";
import { Rail } from "./components/shell/Rail";
import { Sidebar } from "./components/shell/Sidebar";
import { TaskItem } from "./components/task/TaskItem";
import { VoiceWidget } from "./components/voice/VoiceWidget";
import { useVoiceCapture } from "./hooks/useVoiceCapture";
import { createTask, hydrateTaskStore, useTaskStore, useVisibleTasks } from "./stores/taskStore";
import type { SmartView } from "./types/task";

const viewLabels: Record<SmartView, string> = {
  all: "All",
  today: "Today",
  tomorrow: "Tomorrow",
  next7: "Next 7 Days",
  inbox: "Inbox",
};

const viewIcons: Record<SmartView, typeof Inbox> = {
  all: Archive,
  today: Calendar1,
  tomorrow: TimerReset,
  next7: CalendarDays,
  inbox: Inbox,
};

function App() {
  const store = useTaskStore();
  const { openTasks, doneTasks } = useVisibleTasks();
  const [draft, setDraft] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  const { isRecording, startRecording, toggleRecording, voiceMessage, voiceState } = useVoiceCapture();

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

  const currentTitle = useMemo(() => {
    if (store.activeTagId) {
      return store.tags.find((tag) => tag.id === store.activeTagId)?.name ?? "Tag";
    }
    return viewLabels[store.activeView];
  }, [store.activeTagId, store.activeView, store.tags]);

  const ActiveIcon = store.activeTagId ? Tag : viewIcons[store.activeView];

  const handleSubmit = () => {
    const title = draft.trim();
    if (!title) return;
    void createTask(title);
    setDraft("");
  };

  return (
    <main className="app-shell">
      <Rail />
      <Sidebar />
      <section className="task-panel">
        <WindowChrome />

        <div className="content-column">
          <header className="list-header">
            <div className="title-wrap">
              <Menu size={26} strokeWidth={2.4} />
              <button className="view-title" type="button">
                <ActiveIcon size={22} />
                {currentTitle}
              </button>
            </div>
            <div className="header-actions">
              <Button
                isIconOnly
                aria-label="Voice capture"
                className={isRecording ? "icon-button recording" : "icon-button"}
                onPress={toggleRecording}
                variant="ghost"
              >
                <Mic size={20} />
              </Button>
              <Button isIconOnly aria-label="More options" className="icon-button" variant="ghost">
                <MoreHorizontal size={24} />
              </Button>
            </div>
          </header>

          <div className={isRecording ? "voice-input recording" : "voice-input"}>
            <Plus size={24} />
            <input
              aria-label="Add task"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSubmit();
              }}
              placeholder={isRecording ? "Listening... say your tasks" : "Add task"}
              value={draft}
            />
            <button className="voice-pill" onClick={toggleRecording} type="button">
              <Mic size={15} />
              {isRecording ? "Stop" : "Voice"}
            </button>
          </div>

          {store.error ? <div className="store-error">{store.error}</div> : null}

          <div className="task-list" role="list">
            <AnimatePresence initial={false}>
              {openTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </AnimatePresence>
          </div>

          <button className="completed-toggle" onClick={() => setShowCompleted((value) => !value)} type="button">
            {showCompleted ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            <span>Completed</span>
            <strong>{doneTasks.length}</strong>
          </button>

          {showCompleted ? (
            <div className="completed-list">
              {doneTasks.slice(0, 5).map((task) => (
                <TaskItem isCompletedPreview key={task.id} task={task} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
      <VoiceWidget message={voiceMessage} state={voiceState} onToggle={toggleRecording} />
    </main>
  );
}

export default App;
