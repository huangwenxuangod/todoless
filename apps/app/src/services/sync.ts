import { createClient } from "@supabase/supabase-js";
import type { SyncPullPayload, SyncPushPayload } from "@todoless/shared/sync";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const syncEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = syncEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    })
  : null;

export async function pullRemoteChanges(since: string): Promise<SyncPullPayload> {
  if (!supabase) throw new Error("Supabase is not configured");
  const pulledAt = new Date().toISOString();
  const [tasks, tags, taskTags] = await Promise.all([
    supabase.from("tasks").select("*").gt("updated_at", since),
    supabase.from("tags").select("*").gt("updated_at", since),
    supabase.from("task_tags").select("*").gt("updated_at", since),
  ]);

  if (tasks.error) throw tasks.error;
  if (tags.error) throw tags.error;
  if (taskTags.error) throw taskTags.error;

  return {
    tasks: tasks.data ?? [],
    tags: tags.data ?? [],
    taskTags: taskTags.data ?? [],
    pulledAt,
  };
}

export async function pushLocalChanges(payload: SyncPushPayload) {
  if (!supabase) throw new Error("Supabase is not configured");
  const operations = [];

  if (payload.tags.length > 0) {
    operations.push(supabase.from("tags").upsert(payload.tags));
  }
  if (payload.tasks.length > 0) {
    operations.push(supabase.from("tasks").upsert(payload.tasks));
  }
  if (payload.taskTags.length > 0) {
    operations.push(supabase.from("task_tags").upsert(payload.taskTags));
  }

  const results = await Promise.all(operations);
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

export async function signInWithMagicLink(email: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
