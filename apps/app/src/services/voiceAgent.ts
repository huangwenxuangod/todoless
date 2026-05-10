import { AgentCommandSchema } from "@todoless/shared/types/agent";
import { createDefaultTodayDueAt } from "@todoless/shared/lib/date";
import type { Task, TaskTag } from "@todoless/shared/types/task";
import type { AgentCommand } from "@todoless/shared/types/agent";

const OPENROUTER_URL = "https://openrouter.ai/api/v1";

export type VoiceCommand =
  | {
      intent: "create_tasks";
      tasks: Array<Omit<Task, "id" | "status" | "createdAt" | "updatedAt" | "completedAt">>;
      memoryUpdates: unknown[];
    }
  | Exclude<AgentCommand, { intent: "create_tasks" }>;

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

export async function planCommandFromTranscript(
  transcript: string,
  recentTasks: string[] = []
): Promise<VoiceCommand> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("OpenRouter API key not configured");

  const system = `You are todoless, a non-chat voice-to-task command agent.
Return only valid JSON. No markdown. No explanation.
The user is the commander. Convert the transcript into one command and execute their intent without asking questions.
Supported intents: create_tasks, update_tasks, complete_tasks, delete_tasks, set_reminders, set_repeat.
Target schema: {"query":"string or null","ordinal":number or null,"recent":boolean}.
Use {"recent":true} for "刚才那个", "刚刚那个", "last one", "that task".
Use ordinal for "第一个/第二个/first/second".
Use query for title/tag/person/project words such as "发推特那个".
Prefer a single best target unless the user clearly asks for multiple tasks.
Use coarse tags only.
Detect simple recurring tasks. Use repeatRule {"type":"daily","interval":1} for daily/every day tasks, {"type":"weekly","interval":1} for weekly/every week tasks, otherwise {"type":"none"}.
When no time is provided, set dueAt to today at 22:00 and reminderAt to null.
When a date is provided but no time is provided, set dueAt to that date at 22:00 and reminderAt to null.
When the transcript says "提醒我/记得/别忘了", create or update reminderAt. If no time is provided: today 20:00 for same-day vague reminders, 09:00 for future-day reminders.
For "稍后" use reminderAt now + 30 minutes. For "等会" use reminderAt now + 15 minutes.
For "推迟提醒到明天", change reminderAt only. For "推迟任务到明天", change dueAt and move reminderAt to the same date if it exists.
Use priority: 3=P1 urgent/high consequence, 2=P2 important or soon, 1=P3 normal, 0=P4 low pressure.
Use content only when the task needs extra execution context; short tasks should have content null.
Output one of these schemas:
{"intent":"create_tasks","tasks":[{"title":"string","content":null,"dueAt":"ISO string or null","reminderAt":"ISO string or null","priority":0,"repeatRule":{"type":"none"},"tags":["string"]}],"memoryUpdates":[]}
{"intent":"update_tasks","updates":[{"target":{"query":"string or null","ordinal":null,"recent":false},"patch":{"title":"string","content":null,"dueAt":"ISO string or null","reminderAt":"ISO string or null","priority":1,"repeatRule":{"type":"daily","interval":1},"tags":["string"]}}],"memoryUpdates":[]}
{"intent":"complete_tasks","targets":[{"query":"string or null","ordinal":null,"recent":false}],"memoryUpdates":[]}
{"intent":"delete_tasks","targets":[{"query":"string or null","ordinal":null,"recent":false}],"memoryUpdates":[]}
{"intent":"set_reminders","updates":[{"target":{"query":"string or null","ordinal":null,"recent":false},"reminderAt":"ISO string or null"}],"memoryUpdates":[]}
{"intent":"set_repeat","updates":[{"target":{"query":"string or null","ordinal":null,"recent":false},"repeatRule":{"type":"daily","interval":1}}],"memoryUpdates":[]}`;

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

  const parsed = AgentCommandSchema.parse(JSON.parse(content));
  if (parsed.intent !== "create_tasks") return parsed;

  return {
    ...parsed,
    tasks: parsed.tasks.slice(0, 10).map(
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
    ),
  };
}

function slugTag(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .slice(0, 40);
}
