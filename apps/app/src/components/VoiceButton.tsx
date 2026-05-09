import { useState, useRef, useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import { Mic } from "lucide-react-native";
import { colors, radii, spacing } from "../constants/theme";
import { useTaskStore } from "../stores/taskStore";
import {
  transcribeAudio,
  planTasksFromTranscript,
} from "../services/voiceAgent";

type VoiceState = "idle" | "recording" | "thinking" | "done" | "error";

export function VoiceButton() {
  const [state, setState] = useState<VoiceState>("idle");
  const [message, setMessage] = useState("Hold to speak");
  const recordingRef = useRef<Audio.Recording | null>(null);
  const addTasksFromAgent = useTaskStore((s) => s.addTasksFromAgent);

  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Microphone permission required");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setState("recording");
      setMessage("Listening...");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Mic error";
      setState("error");
      setMessage(msg);
      setTimeout(() => {
        setState("idle");
        setMessage("Hold to speak");
      }, 2000);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error("No recording found");

      setState("thinking");
      setMessage("Thinking...");

      // Read file as base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = String(reader.result || "");
          resolve(result.includes(",") ? result.split(",")[1] : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const transcript = await transcribeAudio(base64, blob.type);
      if (!transcript) throw new Error("No speech detected");

      const recentTasks = useTaskStore
        .getState()
        .tasks.slice(0, 10)
        .map((t) => t.title);
      const planned = await planTasksFromTranscript(transcript, recentTasks);
      await addTasksFromAgent(planned);

      setState("done");
      setMessage(`Created ${planned.length} task${planned.length > 1 ? "s" : ""}`);
      setTimeout(() => {
        setState("idle");
        setMessage("Hold to speak");
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState("error");
      setMessage(msg);
      setTimeout(() => {
        setState("idle");
        setMessage("Hold to speak");
      }, 3000);
    }
  }, [addTasksFromAgent]);

  return (
    <View style={styles.wrapper}>
      {state !== "idle" && (
        <View style={[styles.strip, state === "error" && styles.stripError]}>
          <Text style={styles.hint}>{message}</Text>
        </View>
      )}
      <Pressable
        onPressIn={startRecording}
        onPressOut={stopRecording}
        style={[
          styles.button,
          state === "recording" && styles.recording,
          state === "error" && styles.error,
        ]}
      >
        <Mic size={28} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl + 64,
    alignItems: "center",
    gap: spacing.sm,
    zIndex: 20,
  },
  strip: {
    minWidth: 156,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(245, 240, 232, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  stripError: {
    borderColor: colors.error,
  },
  hint: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: "#2f365f",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 240, 232, 0.12)",
  },
  recording: {
    backgroundColor: colors.accent,
    transform: [{ scale: 1.08 }],
  },
  error: {
    backgroundColor: colors.error,
  },
});
