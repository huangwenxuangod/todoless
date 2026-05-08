import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createTasksFromAgent, hydrateTaskStore, useTaskStore } from "./stores/taskStore";
import { planTasksFromTranscript, transcribeAudio } from "./services/voiceAgent";

function WidgetApp() {
  const store = useTaskStore();
  const [state, setState] = useState<"idle" | "recording" | "thinking" | "saved" | "error">("idle");
  const [message, setMessage] = useState("Voice");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    void hydrateTaskStore();
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
      setMessage("Listening");
    } catch (error) {
      setState("error");
      setMessage("No mic");
    }
  };

  const stop = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const process = async (audio: Blob) => {
    try {
      setState("thinking");
      setMessage("Thinking");
      const transcript = await transcribeAudio(audio);
      const recentTasks = store.recentTaskIds
        .map((id) => store.tasks.find((task) => task.id === id)?.title)
        .filter((title): title is string => Boolean(title));
      const planned = await planTasksFromTranscript(transcript, recentTasks);
      const created = await createTasksFromAgent(planned, transcript);
      await emit("tasks-updated", { count: created.length });
      setState("saved");
      setMessage(String(created.length));
      window.setTimeout(() => {
        setState("idle");
        setMessage("Voice");
      }, 1500);
    } catch {
      setState("error");
      setMessage("Error");
    }
  };

  return (
    <main className={`widget-shell ${state}`}>
      <button
        className="widget-button"
        onClick={() => {
          if (state === "recording") stop();
          else void start();
        }}
        onDoubleClick={() => void getCurrentWindow().setFocus()}
        type="button"
      >
        <Mic size={24} />
        <span>{message}</span>
      </button>
    </main>
  );
}

export default WidgetApp;
