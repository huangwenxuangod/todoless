export type TaskStatus = "open" | "done";

export type TaskPriority = 0 | 1 | 2 | 3;

export type SmartView = "all" | "today" | "tomorrow" | "next7" | "inbox";

export type TaskTag = {
  id: string;
  name: string;
  color: string;
};

export type Task = {
  id: string;
  title: string;
  content: string | null;
  status: TaskStatus;
  dueAt: string | null;
  reminderAt: string | null;
  priority: TaskPriority;
  tags: TaskTag[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type PreferenceMemory = {
  commonTags: TaskTag[];
  defaultReminderHour: number;
  recentCorrections: Array<{
    at: string;
    before: Partial<Task>;
    after: Partial<Task>;
  }>;
};
