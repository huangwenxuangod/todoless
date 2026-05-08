import { useCallback, useRef, useState } from "react";
import { emit } from "@tauri-apps/api/event";
import { createTasksFromAgent, getSnapshot } from "../stores/taskStore";
import { showToast } from "../stores/toastStore";
import { planTasksFromTranscript, transcribeAudio } from "../services/voiceAgent";

export type VoiceState = "idle" | "recording" | "transcribing" | "planning" | "saved" | "error";

export function useVoiceCapture() {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceMessage, setVoiceMessage] = useState("Ctrl Shift Space");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const processVoice = useCallback(async (audio: Blob) => {
    try {
      setVoiceState("transcribing");
      setVoiceMessage("Transcribing...");
      const transcript = await transcribeAudio(audio);
      if (!transcript) throw new Error("No speech detected");
      setVoiceState("planning");
      setVoiceMessage("Turning speech into tasks...");
      const store = getSnapshot();
      const recentTasks = store.recentTaskIds
        .map((id) => store.tasks.find((task) => task.id === id)?.title)
        .filter((title): title is string => Boolean(title));
      const plannedTasks = await planTasksFromTranscript(transcript, recentTasks);
      const created = await createTasksFromAgent(plannedTasks, transcript);
      await emit("tasks-updated", { count: created.length });
      setVoiceState("saved");
      setVoiceMessage(`Created ${created.length} task${created.length > 1 ? "s" : ""}`);
      showToast(`Created ${created.length} task${created.length > 1 ? "s" : ""}`, "success");
      window.setTimeout(() => {
        setVoiceState("idle");
        setVoiceMessage("Ctrl Shift Space");
      }, 1800);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(message, "error");
      setVoiceState("error");
      setVoiceMessage("Error");
      window.setTimeout(() => {
        setVoiceState("idle");
        setVoiceMessage("Ctrl Shift Space");
      }, 2000);
    }
  }, []);

  const startRecording = useCallback(async () => {
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
        void processVoice(audio);
      };
      recorder.start();
      setIsRecording(true);
      setVoiceState("recording");
      setVoiceMessage("Listening...");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Microphone unavailable";
      showToast(message, "error");
      setVoiceState("error");
      setVoiceMessage("Error");
      setIsRecording(false);
      window.setTimeout(() => {
        setVoiceState("idle");
        setVoiceMessage("Ctrl Shift Space");
      }, 2000);
    }
  }, [processVoice]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }
    void startRecording();
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    toggleRecording,
    voiceMessage,
    voiceState,
  };
}
