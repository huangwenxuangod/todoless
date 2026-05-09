import type { RepeatRule, TaskPriority, TaskStatus } from "../types/task";

export type SyncTaskRow = {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  status: TaskStatus;
  due_at: string | null;
  reminder_at: string | null;
  priority: TaskPriority;
  repeat_rule: RepeatRule;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  deleted_at: string | null;
  device_id: string;
  version: number;
};

export type SyncTagRow = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SyncTaskTagRow = {
  user_id: string;
  task_id: string;
  tag_id: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SyncStateRow = {
  user_id: string;
  device_id: string;
  last_pulled_at: string;
  last_pushed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SyncPullPayload = {
  tasks: SyncTaskRow[];
  tags: SyncTagRow[];
  taskTags: SyncTaskTagRow[];
  pulledAt: string;
};

export type SyncPushPayload = {
  tasks: SyncTaskRow[];
  tags: SyncTagRow[];
  taskTags: SyncTaskTagRow[];
};
