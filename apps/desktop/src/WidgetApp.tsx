import { Calendar1, CalendarDays, ChevronDown, Inbox, Mic, Minus, Settings, TimerReset, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ToastContainer } from "./components/toast/ToastContainer";
import { SettingsModal } from "./components/settings/SettingsModal";
import { TaskCheckbox, TaskMetaRow } from "./components/task/TaskParts";
import { DropdownMenu } from "./components/ui/DropdownMenu";
import { useScrollVisibility } from "./hooks/useScrollVisibility";
import { showToast } from "./stores/toastStore";
import { initAppSettings } from "./stores/settingsStore";
import { executeAgentCommand, hydrateTaskStore, setActiveView, useTaskStore, useVisibleTasks } from "./stores/taskStore";
import { planCommandFromTranscript, transcribeAudio } from "./services/voiceAgent";
import { formatVoiceError } from "./services/voiceError";
import type { SmartView, Task } from "@todoless/shared/types/task";

const widgetViews: Array<{ id: SmartView; label: string; icon: typeof Inbox }> = [
  { id: "today", label: "Today", icon: Calendar1 },
  { id: "tomorrow", label: "Tomorrow", icon: TimerReset },
  { id: "next7", label: "Next 7 Days", icon: CalendarDays },
  { id: "inbox", label: "Inbox", icon: Inbox },
];

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
  const { onScroll: handleScroll, ref: scrollRef } = useScrollVisibility<HTMLDivElement>();

  useEffect(() => {
    void hydrateTaskStore();
    void initAppSettings();
    const tasksUpdatedPromise = listen("tasks-updated", () => {
      void hydrateTaskStore();
    });
    const shortcutPromise = listen("voice-shortcut", () => {
      void start();
    });
    const shortcutReleasePromise = listen("voice-shortcut-release", () => {
      stop();
    });
    return () => {
      void tasksUpdatedPromise.then((unlisten) => unlisten());
      void shortcutPromise.then((unlisten) => unlisten());
      void shortcutReleasePromise.then((unlisten) => unlisten());
    };
  }, []);

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
      const msg = formatVoiceError(error);
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
      const command = await planCommandFromTranscript(transcript, recentTasks);
      const result = await executeAgentCommand(command, transcript);
      await emit("tasks-updated", { count: result.count, intent: command.intent });
      showToast(result.message, "success");
      setState("saved");
      setMessage(String(result.count));
      setTimeout(() => {
        setState("idle");
        setMessage("Add task");
      }, 1500);
    } catch (error) {
      const msg = formatVoiceError(error);
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
            <DropdownMenu
              activeValue={store.activeView}
              className="widget-view-menu"
              itemClassName="widget-view-item"
              onSelect={(view) => {
                setActiveView(view);
                setMenuOpen(false);
              }}
              options={widgetViews.map((view) => ({
                icon: view.icon,
                label: view.label,
                value: view.id,
              }))}
            />
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
  return (
    <article className="widget-task">
      <TaskCheckbox className="widget-check" showDoneMark={false} task={task} />
      <div className="widget-task-body">
        <div className="widget-task-title">{task.title}</div>
        <TaskMetaRow
          className="widget-task-meta"
          moreClassName="widget-tag-more"
          showClock={false}
          tagClassName="widget-tag"
          tagLimit={1}
          task={task}
          timeClassName="widget-time"
        />
      </div>
    </article>
  );
}

export default WidgetApp;
