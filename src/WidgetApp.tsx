import { Mic, Minus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createTasksFromAgent, hydrateTaskStore, useTaskStore } from "./stores/taskStore";
import { showToast } from "./stores/toastStore";
import { planTasksFromTranscript, transcribeAudio } from "./services/voiceAgent";

function WidgetApp() {
  const store = useTaskStore();
  const [state, setState] = useState<"idle" | "recording" | "thinking" | "saved" | "error">("idle");
  const [message, setMessage] = useState("Add task");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void hydrateTaskStore();
    const tasksUpdatedPromise = listen("tasks-updated", () => {
      void hydrateTaskStore();
    });
    return () => {
      void tasksUpdatedPromise.then((unlisten) => unlisten());
    };
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.classList.add("scrolling");
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      el.classList.remove("scrolling");
    }, 800);
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

  const visibleTasks = store.tasks.filter((t) => t.status === "open").slice(0, 20);

  return (
    <div className="widget-app">
      <header className="widget-header" onPointerDown={startDrag}>
        <span className="widget-brand">tl</span>
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
            onClick={() => void window.close()}
            onPointerDown={(e) => e.stopPropagation()}
            type="button"
          >
            <X size={10} />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="widget-scroll" onScroll={handleScroll}>
        {visibleTasks.length === 0 ? (
          <div className="widget-empty">No tasks yet</div>
        ) : (
          visibleTasks.map((task) => (
            <div className="widget-task" key={task.id}>
              <span className={`widget-check ${task.status === "done" ? "done" : ""}`}></span>
              <span className="widget-task-title">{task.title}</span>
            </div>
          ))
        )}
      </div>

      <div className="widget-voice">
        <button
          className={`widget-voice-btn ${state}`}
          onClick={() => {
            if (state === "recording") stop();
            else void start();
          }}
          type="button"
        >
          {state === "recording" ? <i className="widget-pulse" /> : null}
          <Mic size={16} />
          <span>{message}</span>
        </button>
      </div>
    </div>
  );
}

export default WidgetApp;
