import { create } from "zustand";
import {
  createDefaultTodayDueAt,
  createNextRepeatDate,
  taskBelongsToView,
  taskMatchesView,
} from "@todoless/shared/lib/date";
import { createId } from "@todoless/shared/lib/ids";
import type { SmartView, Task, TaskStatus } from "@todoless/shared/types/task";
import type { AgentTarget, AgentTaskPatch } from "@todoless/shared/types/agent";
import {
  initializeDb,
  insertTask,
  loadTasks,
  updateTask,
  updateTaskStatus,
  deleteTask as dbDeleteTask,
} from "../services/db";
import type { VoiceCommand } from "../services/voiceAgent";

interface TaskStore {
  tasks: Task[];
  isReady: boolean;
  activeView: SmartView;
  setActiveView: (view: SmartView) => void;
  hydrate: () => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  addTask: (title: string) => Promise<void>;
  addTasksFromAgent: (
    tasks: Array<
      Omit<Task, "id" | "status" | "createdAt" | "updatedAt" | "completedAt">
    >
  ) => Promise<void>;
  executeAgentCommand: (
    command: VoiceCommand,
    transcript: string
  ) => Promise<{ count: number; message: string }>;
  updateTaskFields: (id: string, patch: AgentTaskPatch) => Promise<Task | null>;
  removeTask: (id: string) => Promise<void>;
  getOpenTasks: () => Task[];
  getDoneTasks: () => Task[];
  getInboxTasks: () => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isReady: false,
  activeView: "today",

  setActiveView: (view) => set({ activeView: view }),

  hydrate: async () => {
    await initializeDb();
    const tasks = await loadTasks();
    set({ tasks, isReady: true });
  },

  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const nextStatus: TaskStatus = task.status === "done" ? "open" : "done";
    const now = new Date().toISOString();
    const nextRepeatTask = nextStatus === "done" ? createNextRepeatTask(task, now) : null;
    await updateTaskStatus(id, nextStatus);
    if (nextRepeatTask) await insertTask(nextRepeatTask);
    set((state) => ({
      tasks: [
        ...(nextRepeatTask ? [nextRepeatTask] : []),
        ...state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: nextStatus,
              completedAt: nextStatus === "done" ? now : null,
              updatedAt: now,
            }
          : t
        ),
      ],
    }));
  },

  addTask: async (title) => {
    const now = new Date().toISOString();
    const task: Task = {
      id: createId(),
      title,
      content: null,
      status: "open",
      dueAt: createDefaultTodayDueAt("22:00"),
      reminderAt: null,
      priority: 1,
      repeatRule: { type: "none" },
      tags: [],
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    await insertTask(task);
    set((state) => ({ tasks: [task, ...state.tasks] }));
  },

  addTasksFromAgent: async (items) => {
    const now = new Date().toISOString();
    const created: Task[] = [];
    for (const item of items.slice(0, 10)) {
      const task: Task = {
        id: createId(),
        ...item,
        status: "open",
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      };
      await insertTask(task);
      created.push(task);
    }
    set((state) => ({ tasks: [...created, ...state.tasks] }));
  },

  executeAgentCommand: async (command) => {
    if (command.intent === "create_tasks") {
      await get().addTasksFromAgent(command.tasks);
      return {
        count: command.tasks.length,
        message: `Created ${command.tasks.length} task${command.tasks.length > 1 ? "s" : ""}`,
      };
    }

    if (command.intent === "update_tasks") {
      let updated = 0;
      for (const item of command.updates) {
        const task = resolveTaskTarget(get().tasks, item.target);
        if (!task) continue;
        const next = await get().updateTaskFields(task.id, item.patch);
        if (next) updated += 1;
      }
      return { count: updated, message: `Updated ${updated} task${updated > 1 ? "s" : ""}` };
    }

    if (command.intent === "complete_tasks") {
      let completed = 0;
      for (const target of command.targets) {
        const task = resolveTaskTarget(get().tasks, target);
        if (!task || task.status === "done") continue;
        await get().toggleTask(task.id);
        completed += 1;
      }
      return { count: completed, message: `Completed ${completed} task${completed > 1 ? "s" : ""}` };
    }

    if (command.intent === "delete_tasks") {
      let deleted = 0;
      for (const target of command.targets) {
        const task = resolveTaskTarget(get().tasks, target);
        if (!task) continue;
        await get().removeTask(task.id);
        deleted += 1;
      }
      return { count: deleted, message: `Deleted ${deleted} task${deleted > 1 ? "s" : ""}` };
    }

    if (command.intent === "set_reminders") {
      let updated = 0;
      for (const item of command.updates) {
        const task = resolveTaskTarget(get().tasks, item.target);
        if (!task) continue;
        const next = await get().updateTaskFields(task.id, { reminderAt: item.reminderAt });
        if (next) updated += 1;
      }
      return { count: updated, message: updated === 1 ? "Reminder updated" : `Updated ${updated} reminders` };
    }

    if (command.intent === "set_repeat") {
      let updated = 0;
      for (const item of command.updates) {
        const task = resolveTaskTarget(get().tasks, item.target);
        if (!task) continue;
        const next = await get().updateTaskFields(task.id, { repeatRule: item.repeatRule });
        if (next) updated += 1;
      }
      return { count: updated, message: updated === 1 ? "Repeat updated" : `Updated ${updated} repeats` };
    }

    return { count: 0, message: "No task changed" };
  },

  updateTaskFields: async (id, patch) => {
    const current = get().tasks.find((t) => t.id === id);
    if (!current) return null;
    const now = new Date().toISOString();
    const next: Task = {
      ...current,
      title: patch.title ?? current.title,
      content: patch.content === undefined ? current.content : patch.content,
      dueAt: patch.dueAt === undefined ? current.dueAt : patch.dueAt,
      reminderAt: patch.reminderAt === undefined ? current.reminderAt : patch.reminderAt,
      priority: patch.priority ?? current.priority,
      repeatRule: patch.repeatRule ?? current.repeatRule,
      tags: patch.tags
        ? patch.tags.map((tag) => ({
            id: `tag-${tag.trim().toLowerCase().replace(/\s+/g, "-")}`,
            name: tag,
            color: "#6aa6ff",
          }))
        : current.tags,
      updatedAt: now,
    };
    await updateTask(next);
    set((state) => ({ tasks: state.tasks.map((task) => (task.id === id ? next : task)) }));
    return next;
  },

  removeTask: async (id) => {
    await dbDeleteTask(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },

  getOpenTasks: () => {
    const { tasks, activeView } = get();
    if (activeView === "inbox") {
      return tasks.filter((t) => t.status === "open" && !t.dueAt);
    }
    return tasks.filter((t) => taskBelongsToView(t, activeView));
  },

  getDoneTasks: () => {
    const { tasks, activeView } = get();
    if (activeView === "inbox") {
      return tasks.filter((t) => t.status === "done" && !t.dueAt);
    }
    return tasks.filter(
      (t) => t.status === "done" && taskMatchesView(t, activeView)
    );
  },

  getInboxTasks: () => {
    return get().tasks.filter((t) => t.status === "open" && !t.dueAt);
  },
}));

function resolveTaskTarget(tasks: Task[], target: AgentTarget): Task | null {
  const sorted = [...tasks].sort((left, right) => {
    if (left.status !== right.status) return left.status === "open" ? -1 : 1;
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });

  if (target.ordinal) return sorted[target.ordinal - 1] ?? null;
  if (target.recent) return sorted[0] ?? null;

  if (target.query?.trim()) {
    const query = normalizeText(target.query);
    return (
      sorted
        .map((task) => ({ task, score: scoreTaskMatch(task, query) }))
        .filter((item) => item.score > 0)
        .sort((left, right) => right.score - left.score)[0]?.task ?? null
    );
  }

  return sorted[0] ?? null;
}

function scoreTaskMatch(task: Task, query: string) {
  const title = normalizeText(task.title);
  const content = normalizeText(task.content ?? "");
  const tags = normalizeText(task.tags.map((tag) => tag.name).join(" "));
  let score = 0;
  if (title === query) score += 100;
  if (title.includes(query)) score += 60;
  if (content.includes(query)) score += 20;
  if (tags.includes(query)) score += 24;
  if (task.status === "open") score += 8;
  return score;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function createNextRepeatTask(task: Task, now: string): Task | null {
  if (task.repeatRule.type === "none") return null;
  return {
    ...task,
    id: createId(),
    status: "open",
    dueAt: createNextRepeatDate(task.dueAt, task.repeatRule),
    reminderAt: task.reminderAt ? createNextRepeatDate(task.reminderAt, task.repeatRule) : null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
}
