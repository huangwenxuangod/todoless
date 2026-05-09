import { AgentCreateTasksSchema } from "@todoless/shared/types/agent";
import { createDefaultTodayDueAt } from "@todoless/shared/lib/date";
import type { Task, TaskTag } from "@todoless/shared/types/task";

const OPENROUTER_URL = "https://openrouter.ai/api/v1";

function getApiKey(): string {
  // TODO: move to secure storage or env
  return process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || "";
}

export async function transcribeAudio(audioBase64: string, mimeType: string) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("OpenRouter API key not configured");

  const format = mimeType.includes("webm")
    ? "webm"
    : mimeType.includes("mp4")
    ? "mp4"
    : mimeType.includes("mp3")
    ? "mp3"
    : "webm";

  const res = await fetch(`${OPENROUTER_URL}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://todoless.app",
      "X-Title": "todoless",
    },
    body: JSON.stringify({
      model: "openai/whisper-large-v3-turbo",
      input_audio: { data: audioBase64, format },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Transcription failed: ${text}`);
  }

  const data = await res.json();
  return data.text?.trim() || "";
}

export async function planTasksFromTranscript(
  transcript: string,
  recentTasks: string[] = []
) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("OpenRouter API key not configured");

  const system = `You are todoless, a non-chat voice-to-task agent.
Return only valid JSON. No markdown. No explanation.
Create up to 10 tasks from the transcript.
Use coarse tags only.
Detect simple recurring tasks. Use repeatRule {"type":"daily","interval":1} for daily/every day tasks, {"type":"weekly","interval":1} for weekly/every week tasks, otherwise {"type":"none"}.
When no time is provided, set dueAt to today at 22:00 and reminderAt to null.
When a date is provided but no time is provided, set dueAt to that date at 22:00 and reminderAt to that date at 09:00.
Use priority: 3=P1 urgent/high consequence, 2=P2 important or soon, 1=P3 normal, 0=P4 low pressure.
Use content only when the task needs extra execution context; short tasks should have content null.
Output schema:
{"intent":"create_tasks","tasks":[{"title":"string","content":null,"dueAt":"ISO string or null","reminderAt":"ISO string or null","priority":0,"repeatRule":{"type":"none"},"tags":["string"]}],"memoryUpdates":[]}`;

  const user = `Today: ${new Date().toISOString()}
Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"}
Default due time: 22:00
Recent tasks: ${JSON.stringify(recentTasks)}
Transcript: ${transcript}`;

  const res = await fetch(`${OPENROUTER_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://todoless.app",
      "X-Title": "todoless",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-v4-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Planning failed: ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");

  const parsed = AgentCreateTasksSchema.parse(JSON.parse(content));

  return parsed.tasks.slice(0, 10).map(
    (task): Omit<Task, "id" | "status" | "createdAt" | "updatedAt" | "completedAt"> => ({
      title: task.title,
      content: task.content ?? null,
      dueAt: task.dueAt ?? createDefaultTodayDueAt("22:00"),
      reminderAt: task.reminderAt ?? null,
      priority: task.priority,
      repeatRule: task.repeatRule ?? { type: "none" },
      tags: task.tags.map(
        (tag): TaskTag => ({
          id: `tag-${slugTag(tag)}`,
          name: tag,
          color: "#6aa6ff",
        })
      ),
    })
  );
}

function slugTag(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .slice(0, 40);
}
