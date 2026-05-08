import {
  Archive,
  Bell,
  Calendar1,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Crown,
  Inbox,
  ListChecks,
  Menu,
  Mic,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Tag,
  Target,
  TimerReset,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@heroui/react";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createTask, createTasksFromAgent, hydrateTaskStore, setActiveTag, setActiveView, toggleTask, useTaskStore, useVisibleTasks } from "./stores/taskStore";
import { formatTaskTime, isSameDay, isWithinNext7Days } from "./lib/date";
import { planTasksFromTranscript, transcribeAudio } from "./services/voiceAgent";
import type { SmartView, Task, TaskPriority } from "./types/task";

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

const priorityClass: Record<TaskPriority, string> = {
  0: "priority-none",
  1: "priority-low",
  2: "priority-medium",
  3: "priority-high",
};

function App() {
  const store = useTaskStore();
  const { openTasks, doneTasks } = useVisibleTasks();
  const [isRecording, setIsRecording] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "transcribing" | "planning" | "saved" | "error">("idle");
  const [voiceMessage, setVoiceMessage] = useState("Ctrl Shift Space");
  const [draft, setDraft] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

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
  }, []);

  const currentTitle = useMemo(() => {
    if (store.activeTagId) {
      return store.tags.find((tag) => tag.id === store.activeTagId)?.name ?? "Tag";
    }
    return viewLabels[store.activeView];
  }, [store.activeTagId, store.activeView, store.tags]);

  const activeViewIcon = store.activeTagId ? Tag : viewIcons[store.activeView];
  const ActiveIcon = activeViewIcon;

  const handleSubmit = () => {
    const title = draft.trim();
    if (!title) return;
    void createTask(title);
    setDraft("");
  };

  const startRecording = async () => {
    if (recorderRef.current?.state === "recording") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
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
        streamRef.current = null;
        void processVoice(audio);
      };
      recorder.start();
      setIsRecording(true);
      setVoiceState("recording");
      setVoiceMessage("Listening...");
    } catch (error) {
      setVoiceState("error");
      setVoiceMessage(error instanceof Error ? error.message : "Microphone unavailable");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    void startRecording();
  };

  const processVoice = async (audio: Blob) => {
    try {
      setVoiceState("transcribing");
      setVoiceMessage("Transcribing...");
      const transcript = await transcribeAudio(audio);
      if (!transcript) throw new Error("No speech detected");
      setVoiceState("planning");
      setVoiceMessage("Turning speech into tasks...");
      const recentTasks = store.recentTaskIds
        .map((id) => store.tasks.find((task) => task.id === id)?.title)
        .filter((title): title is string => Boolean(title));
      const plannedTasks = await planTasksFromTranscript(transcript, recentTasks);
      const created = await createTasksFromAgent(plannedTasks, transcript);
      await emit("tasks-updated", { count: created.length });
      setVoiceState("saved");
      setVoiceMessage(`Created ${created.length} task${created.length > 1 ? "s" : ""}`);
      window.setTimeout(() => {
        setVoiceState("idle");
        setVoiceMessage("Ctrl Shift Space");
      }, 1800);
    } catch (error) {
      setVoiceState("error");
      setVoiceMessage(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <main className="app-shell">
      <Rail />
      <Sidebar />
      <section className="task-panel">
        <header className="window-chrome">
          <span title="Pinned mode">
            <Crown className="chrome-crown" size={18} />
          </span>
          <span />
          <button className="chrome-button" aria-label="Minimize" type="button">
            -
          </button>
          <button className="chrome-button square" aria-label="Maximize" type="button" />
          <button className="chrome-button" aria-label="Close" type="button">
            <X size={18} />
          </button>
        </header>

        <div className="content-column">
          <header className="list-header">
            <div className="title-wrap">
              <Menu size={26} strokeWidth={2.4} />
              <div className="title-stack">
                <button className="view-title" type="button">
                  <ActiveIcon size={22} />
                  {currentTitle}
                </button>
              </div>
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
                <TaskRow key={task.id} task={task} />
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
                <TaskRow isCompletedPreview key={task.id} task={task} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
      <VoiceWidget message={voiceMessage} state={voiceState} onToggle={toggleRecording} />
    </main>
  );
}

function VoiceWidget({
  message,
  onToggle,
  state,
}: {
  message: string;
  onToggle: () => void;
  state: "idle" | "recording" | "transcribing" | "planning" | "saved" | "error";
}) {
  return (
    <button className={`voice-widget ${state}`} onClick={onToggle} type="button" title="Ctrl + Shift + Space">
      <span className="voice-widget-dot">
        <Mic size={18} />
      </span>
      <span className="voice-widget-text">{message}</span>
      {state === "recording" ? <i className="voice-meter" /> : null}
    </button>
  );
}

function Rail() {
  return (
    <aside className="rail">
      <button className="avatar-button" type="button">
        <span className="avatar-crown">♛</span>
      </button>
      <nav className="rail-nav" aria-label="Workspace">
        <RailButton active icon={CheckSquare} label="Tasks" />
        <RailButton icon={CalendarDays} label="Calendar" />
        <RailButton icon={Target} label="Focus" />
        <RailButton icon={Clock3} label="Timeline" />
        <RailButton icon={Search} label="Search" />
      </nav>
      <nav className="rail-nav bottom" aria-label="Utility">
        <RailButton icon={TimerReset} label="Sync" />
        <RailButton icon={Bell} label="Notifications" />
        <RailButton icon={CircleHelp} label="Help" />
      </nav>
    </aside>
  );
}

function RailButton({ active, icon: Icon, label }: { active?: boolean; icon: typeof Inbox; label: string }) {
  return (
    <button className={active ? "rail-button active" : "rail-button"} title={label} type="button" aria-label={label}>
      <Icon size={28} />
    </button>
  );
}

function Sidebar() {
  const store = useTaskStore();

  const counts = useMemo(() => {
    return {
      today: store.tasks.filter((task) => task.status === "open" && isSameDay(task.dueAt, new Date())).length,
      next7: store.tasks.filter((task) => task.status === "open" && isWithinNext7Days(task.dueAt)).length,
      inbox: store.tasks.filter((task) => task.status === "open" && !task.dueAt).length,
    };
  }, [store.tasks]);

  return (
    <aside className="sidebar">
      <nav className="smart-list" aria-label="Smart lists">
        <SidebarView icon={Calendar1} id="today" label="Today" count={counts.today} />
        <SidebarView icon={CalendarDays} id="next7" label="Next 7 Days" count={counts.next7} />
        <SidebarView icon={Inbox} id="inbox" label="Inbox" count={counts.inbox} />
      </nav>
      <div className="divider" />
      <section className="sidebar-section">
        <h2>Lists</h2>
        <div className="muted-card">Use lists to categorize and manage your tasks and notes</div>
      </section>
      <section className="sidebar-section tags-section">
        <h2>Tags</h2>
        {store.tags.map((tag) => (
          <button
            className={store.activeTagId === tag.id ? "tag-link active" : "tag-link"}
            key={tag.id}
            onClick={() => setActiveTag(tag.id)}
            type="button"
          >
            <Tag size={25} />
            <span>{tag.name}</span>
            <i style={{ background: tag.color }} />
            <strong>{store.tasks.filter((task) => task.status === "open" && task.tags.some((item) => item.id === tag.id)).length || ""}</strong>
          </button>
        ))}
      </section>
      <section className="sidebar-section">
        <h2>Filters</h2>
        <div className="muted-card">Display tasks filtered by list, date, priority, tag, and more</div>
      </section>
      <div className="divider" />
      <button className="completed-link" type="button">
        <ListChecks size={24} />
        Completed
      </button>
    </aside>
  );
}

function SidebarView({
  count,
  icon: Icon,
  id,
  label,
}: {
  count: number;
  icon: typeof Inbox;
  id: SmartView;
  label: string;
}) {
  const store = useTaskStore();

  return (
    <button className={store.activeView === id && !store.activeTagId ? "sidebar-view active" : "sidebar-view"} onClick={() => setActiveView(id)} type="button">
      <Icon size={24} />
      <span>{label}</span>
      <strong>{count}</strong>
    </button>
  );
}

function TaskRow({ isCompletedPreview, task }: { isCompletedPreview?: boolean; task: Task }) {
  const [expanded, setExpanded] = useState(false);
  const visibleTags = task.tags.slice(0, 1);
  const hiddenTagCount = Math.max(task.tags.length - visibleTags.length, 0);

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className={isCompletedPreview ? "task-row completed-preview" : "task-row"}
      exit={{ opacity: 0, y: -6 }}
      initial={{ opacity: 0, y: 6 }}
      layout
      role="listitem"
    >
      <button
        aria-label={task.status === "done" ? "Mark task open" : "Complete task"}
        className={`check-box ${priorityClass[task.priority]} ${task.status === "done" ? "done" : ""}`}
        onClick={() => void toggleTask(task.id)}
        type="button"
      >
        {task.status === "done" ? "✓" : null}
      </button>
      <button className="task-main" onClick={() => setExpanded((value) => !value)} type="button">
        <span className="task-title">{task.title}</span>
        {expanded && task.content ? <span className="task-content">{task.content}</span> : null}
      </button>
      <div className="task-meta">
        {visibleTags.map((tag) => (
          <span className="tag-chip" key={tag.id} style={{ "--tag-color": tag.color } as React.CSSProperties}>
            {tag.name}
          </span>
        ))}
        {hiddenTagCount > 0 ? <span className="tag-more">+{hiddenTagCount}</span> : null}
        {task.reminderAt ? <Clock3 className="meta-icon" size={17} /> : null}
        {task.dueAt ? <span className="task-time">{formatTaskTime(task.reminderAt ?? task.dueAt)}</span> : null}
      </div>
    </motion.article>
  );
}

export default App;
