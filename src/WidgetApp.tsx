import { Calendar1, CalendarDays, ChevronDown, Inbox, Mic, Minus, Settings, TimerReset, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ToastContainer } from "./components/toast/ToastContainer";
import { SettingsModal } from "./components/settings/SettingsModal";
import { formatTaskTime } from "./lib/date";
import { showToast } from "./stores/toastStore";
import { initAppSettings } from "./stores/settingsStore";
import { createTasksFromAgent, hydrateTaskStore, setActiveView, toggleTask, useTaskStore, useVisibleTasks } from "./stores/taskStore";
import { planTasksFromTranscript, transcribeAudio } from "./services/voiceAgent";
import type { SmartView, Task, TaskPriority } from "./types/task";

const widgetViews: Array<{ id: SmartView; label: string; icon: typeof Inbox }> = [
  { id: "today", label: "Today", icon: Calendar1 },
  { id: "tomorrow", label: "Tomorrow", icon: TimerReset },
  { id: "next7", label: "Next 7 Days", icon: CalendarDays },
  { id: "inbox", label: "Inbox", icon: Inbox },
];

const priorityClass: Record<TaskPriority, string> = {
  0: "priority-none",
  1: "priority-low",
  2: "priority-medium",
  3: "priority-high",
};

function WidgetApp() {
  const store = useTaskStore();
  const { openTasks } = useVisibleTasks();
  const [state, setState] = useState<"idle" | "recording" | "thinking" | "saved" | "error">("idle");
  const [message, setMessage] = useState("Add task");
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void hydrateTaskStore();
    void initAppSettings();
    const tasksUpdatedPromise = listen("tasks-updated", () => {
      void hydrateTaskStore();
    });
    return () => {
      void tasksUpdatedPromise.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    element.classList.add("scrolling");
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      element.classList.remove("scrolling");
    }, 700);
  };

  const start = async () => {
    if (recorderRef.current?.state === "recording") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const audio = new Blob(chunksRef.current, { type: recorder.mimeType });
        stream.getTracks().forEach((track) => track.stop());
        void process(audio);
      };
      recorder.start();
      setState("recording");
      setMessage("Listening...");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "No mic";
      showToast(msg, "error");
      setState("error");
      setMessage("Error");
      setTimeout(() => {
        setState("idle");
        setMessage("Add task");
      }, 2000);
    }
  };

  const stop = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const process = async (audio: Blob) => {
    try {
      setState("thinking");
      setMessage("Thinking...");
      const transcript = await transcribeAudio(audio);
      if (!transcript) throw new Error("No speech detected");
      const recentTasks = store.recentTaskIds
        .map((id) => store.tasks.find((task) => task.id === id)?.title)
        .filter((title): title is string => Boolean(title));
      const planned = await planTasksFromTranscript(transcript, recentTasks);
      const created = await createTasksFromAgent(planned, transcript);
      await emit("tasks-updated", { count: created.length });
      showToast(`Created ${created.length} task${created.length > 1 ? "s" : ""}`, "success");
      setState("saved");
      setMessage(String(created.length));
      setTimeout(() => {
        setState("idle");
        setMessage("Add task");
      }, 1500);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      showToast(msg, "error");
      setState("error");
      setMessage("Error");
      setTimeout(() => {
        setState("idle");
        setMessage("Add task");
      }, 2000);
    }
  };

  const window = getCurrentWindow();
  const startDrag = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest("button")) return;
    void window.startDragging();
  };

  const activeView = widgetViews.find((view) => view.id === store.activeView) ?? widgetViews[0];
  const visibleTasks = openTasks.slice(0, 30);

  return (
    <div
      className="widget-app"
      onClick={() => setContextMenu(null)}
      onContextMenu={(event) => {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY });
      }}
    >
      <header className="widget-header" onPointerDown={startDrag}>
        <div className="widget-title-wrap">
          <button
            className="widget-title"
            onClick={() => setMenuOpen((value) => !value)}
            onPointerDown={(e) => e.stopPropagation()}
            type="button"
          >
            <span>{activeView.label}</span>
            <ChevronDown size={13} />
          </button>
          {menuOpen ? (
            <div className="widget-view-menu">
              {widgetViews.map((view) => {
                const Icon = view.icon;
                return (
                  <button
                    className={store.activeView === view.id ? "widget-view-item active" : "widget-view-item"}
                    key={view.id}
                    onClick={() => {
                      setActiveView(view.id);
                      setMenuOpen(false);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    type="button"
                  >
                    <Icon size={13} />
                    <span>{view.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <div className="widget-controls">
          <button
            aria-label="Minimize"
            className="widget-chrome-btn"
            onClick={() => void window.minimize()}
            onPointerDown={(e) => e.stopPropagation()}
            type="button"
          >
            <Minus size={10} />
          </button>
          <button
            aria-label="Close"
            className="widget-chrome-btn"
            onClick={() => void window.hide()}
            onPointerDown={(e) => e.stopPropagation()}
            type="button"
          >
            <X size={10} />
          </button>
        </div>
      </header>

      <div className="widget-scroll" onScroll={handleScroll} ref={scrollRef}>
        {visibleTasks.length === 0 ? (
          <div className="widget-empty">No tasks yet</div>
        ) : (
          visibleTasks.map((task) => <WidgetTaskItem key={task.id} task={task} />)
        )}
      </div>

      <div className="widget-add-task">
        <button
          className={`widget-add-btn ${state}`}
          onClick={() => {
            if (state === "recording") stop();
            else void start();
          }}
          title={message}
          type="button"
        >
          {state === "recording" ? <i className="widget-pulse" /> : null}
          <Mic size={16} />
        </button>
      </div>
      <ToastContainer />
      {contextMenu ? (
        <div className="widget-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button
            onClick={() => {
              setContextMenu(null);
              setSettingsOpen(true);
            }}
            type="button"
          >
            <Settings size={13} />
            <span>Settings</span>
          </button>
        </div>
      ) : null}
      {settingsOpen ? <SettingsModal onClose={() => setSettingsOpen(false)} /> : null}
    </div>
  );
}

function WidgetTaskItem({ task }: { task: Task }) {
  const visibleTags = task.tags.slice(0, 1);

  return (
    <article className="widget-task">
      <button
        aria-label="Complete task"
        className={`widget-check ${priorityClass[task.priority]}`}
        onClick={() => void toggleTask(task.id)}
        type="button"
      />
      <div className="widget-task-body">
        <div className="widget-task-title">{task.title}</div>
        <div className="widget-task-meta">
          {visibleTags.map((tag) => (
            <span className="widget-tag" key={tag.id} style={{ "--tag-color": tag.color } as React.CSSProperties}>
              {tag.name}
            </span>
          ))}
          {task.dueAt ? <span className="widget-time">{formatTaskTime(task.reminderAt ?? task.dueAt)}</span> : null}
        </div>
      </div>
    </article>
  );
}

export default WidgetApp;
