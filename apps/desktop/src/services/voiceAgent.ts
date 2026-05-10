import { invoke } from "@tauri-apps/api/core";
import { AgentCommandSchema } from "@todoless/shared/types/agent";
import { createDefaultTodayDueAt } from "@todoless/shared/lib/date";
import { getAppSettings } from "../stores/settingsStore";
import type { Task, TaskTag } from "@todoless/shared/types/task";
import type { AgentCommand } from "@todoless/shared/types/agent";

type TranscribeResponse = {
  text: string;
};

type PlanTasksResponse = {
  json: string;
};

const fallbackTagColor = "#6aa6ff";

export type VoiceCommand =
  | {
      intent: "create_tasks";
      tasks: Array<Omit<Task, "id" | "status" | "createdAt" | "updatedAt" | "completedAt">>;
      memoryUpdates: unknown[];
    }
  | Exclude<AgentCommand, { intent: "create_tasks" }>;

export async function transcribeAudio(blob: Blob) {
  const audioBase64 = await blobToBase64(blob);
  const settings = getAppSettings();
  const response = await invoke<TranscribeResponse>("transcribe_audio", {
    request: {
      audioBase64,
      model: settings.asrModel,
      mimeType: blob.type || "audio/webm",
    },
  });
  return response.text.trim();
}

export async function planCommandFromTranscript(transcript: string, recentTasks: string[]): Promise<VoiceCommand> {
  const settings = getAppSettings();
  const response = await invoke<PlanTasksResponse>("plan_tasks", {
    request: {
      transcript,
      model: settings.textModel,
      defaultDueTime: settings.defaultDueTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai",
      today: new Date().toISOString(),
      recentTasks,
    },
  });
  const parsed = AgentCommandSchema.parse(JSON.parse(response.json));
  if (parsed.intent !== "create_tasks") return parsed;

  return {
    ...parsed,
    tasks: parsed.tasks.slice(0, 10).map((task): Omit<Task, "id" | "status" | "createdAt" | "updatedAt" | "completedAt"> => {
      const dueAt = task.dueAt ?? createDefaultTodayDueAt(settings.defaultDueTime);
      return {
        title: task.title,
        content: task.content ?? null,
        dueAt,
        reminderAt: task.reminderAt ?? null,
        priority: task.priority,
        repeatRule: task.repeatRule ?? { type: "none" },
        tags: task.tags.map((tag): TaskTag => ({ id: `tag-${slugTag(tag)}`, name: tag, color: fallbackTagColor })),
      };
    }),
  };
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read audio"));
    reader.readAsDataURL(blob);
  });
}

function slugTag(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .slice(0, 40);
}
