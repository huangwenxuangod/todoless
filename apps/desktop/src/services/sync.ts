import type { SyncPullPayload, SyncPushPayload } from "@todoless/shared/sync";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const syncEnabled = Boolean(supabaseUrl && supabaseAnonKey);

type RequestOptions = {
  accessToken: string;
  method?: "GET" | "POST";
  body?: unknown;
};

export async function pullRemoteChanges(accessToken: string, since: string): Promise<SyncPullPayload> {
  if (!syncEnabled) throw new Error("Supabase is not configured");
  const pulledAt = new Date().toISOString();
  const encodedSince = encodeURIComponent(since);
  const [tasks, tags, taskTags] = await Promise.all([
    request(`/rest/v1/tasks?select=*&updated_at=gt.${encodedSince}`, { accessToken }),
    request(`/rest/v1/tags?select=*&updated_at=gt.${encodedSince}`, { accessToken }),
    request(`/rest/v1/task_tags?select=*&updated_at=gt.${encodedSince}`, { accessToken }),
  ]);

  return {
    tasks: tasks as SyncPullPayload["tasks"],
    tags: tags as SyncPullPayload["tags"],
    taskTags: taskTags as SyncPullPayload["taskTags"],
    pulledAt,
  };
}

export async function pushLocalChanges(accessToken: string, payload: SyncPushPayload) {
  if (!syncEnabled) throw new Error("Supabase is not configured");
  const operations: Array<Promise<unknown>> = [];
  if (payload.tags.length > 0) {
    operations.push(request("/rest/v1/tags", { accessToken, method: "POST", body: payload.tags }));
  }
  if (payload.tasks.length > 0) {
    operations.push(request("/rest/v1/tasks", { accessToken, method: "POST", body: payload.tasks }));
  }
  if (payload.taskTags.length > 0) {
    operations.push(request("/rest/v1/task_tags", { accessToken, method: "POST", body: payload.taskTags }));
  }
  await Promise.all(operations);
}

async function request(path: string, options: RequestOptions) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase sync failed: ${response.status} ${text}`);
  }
  return response.status === 204 ? null : response.json();
}
