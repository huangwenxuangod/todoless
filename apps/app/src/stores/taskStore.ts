import { create } from "zustand";
import {
  createDefaultTodayDueAt,
  createNextRepeatDate,
  taskBelongsToView,
  taskMatchesView,
} from "@todoless/shared/lib/date";
import { createId } from "@todoless/shared/lib/ids";
import type { SmartView, Task, TaskStatus } from "@todoless/shared/types/task";
import {
  initializeDb,
  insertTask,
  loadTasks,
  updateTaskStatus,
  deleteTask as dbDeleteTask,
} from "../services/db";

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
