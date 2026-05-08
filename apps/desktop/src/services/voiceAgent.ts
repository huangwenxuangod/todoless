import { invoke } from "@tauri-apps/api/core";
import { AgentCreateTasksSchema } from "@todoless/shared/types/agent";
import { createDefaultTodayDueAt } from "@todoless/shared/lib/date";
import { getAppSettings } from "../stores/settingsStore";
import type { Task, TaskTag } from "@todoless/shared/types/task";

type TranscribeResponse = {
  text: string;
};

type PlanTasksResponse = {
  json: string;
};

const fallbackTagColor = "#6aa6ff";

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

export async function planTasksFromTranscript(transcript: string, recentTasks: string[]) {
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
  const parsed = AgentCreateTasksSchema.parse(JSON.parse(response.json));
  return parsed.tasks.slice(0, 10).map((task): Omit<Task, "id" | "status" | "createdAt" | "updatedAt" | "completedAt"> => {
    const dueAt = task.dueAt ?? createDefaultTodayDueAt(settings.defaultDueTime);
    return {
      title: task.title,
      content: task.content ?? null,
      dueAt,
      reminderAt: task.reminderAt ?? null,
      priority: task.priority,
      tags: task.tags.map((tag): TaskTag => ({ id: `tag-${slugTag(tag)}`, name: tag, color: fallbackTagColor })),
    };
  });
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
