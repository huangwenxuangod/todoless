import { useState, useRef, useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import { Mic, X } from "lucide-react-native";
import { colors, radii, spacing } from "../constants/theme";
import { useTaskStore } from "../stores/taskStore";
import {
  transcribeAudio,
  planCommandFromTranscript,
} from "../services/voiceAgent";

type VoiceState = "idle" | "recording" | "thinking" | "done" | "error";

export function VoiceButton() {
  const [state, setState] = useState<VoiceState>("idle");
  const [message, setMessage] = useState("Hold to speak");
  const recordingRef = useRef<Audio.Recording | null>(null);
  const executeAgentCommand = useTaskStore((s) => s.executeAgentCommand);

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
      const command = await planCommandFromTranscript(transcript, recentTasks);
      const result = await executeAgentCommand(command, transcript);

      setState("done");
      setMessage(result.message);
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
  }, [executeAgentCommand]);

  return (
    <View style={styles.wrapper}>
      {state !== "idle" && (
        <View style={[styles.strip, state === "error" && styles.stripError]}>
          {state === "recording" ? <View style={styles.recordingDot} /> : null}
          <Text style={styles.hint}>{message}</Text>
          {state === "recording" ? (
            <View style={styles.cancelHint}>
              <X size={12} color={colors.faint} />
              <Text style={styles.cancelText}>release to send</Text>
            </View>
          ) : null}
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
    gap: spacing.md,
    zIndex: 20,
  },
  strip: {
    minWidth: 190,
    minHeight: 42,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: "rgba(26, 25, 23, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(245, 240, 232, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  stripError: {
    borderColor: colors.error,
  },
  hint: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "700",
  },
  recordingDot: {
    width: 7,
    height: 7,
    borderRadius: radii.full,
    backgroundColor: colors.error,
  },
  cancelHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  cancelText: {
    color: colors.faint,
    fontSize: 11,
    fontWeight: "600",
  },
  button: {
    width: 66,
    height: 66,
    borderRadius: radii.full,
    backgroundColor: "#2f365f",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 240, 232, 0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  recording: {
    backgroundColor: colors.accent,
    transform: [{ scale: 1.08 }],
  },
  error: {
    backgroundColor: colors.error,
  },
});
