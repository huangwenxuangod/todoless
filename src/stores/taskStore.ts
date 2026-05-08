import { useMemo, useSyncExternalStore } from "react";
import { seedTags, seedTasks } from "../data/seed";
import { createDefaultReminderAt, createDefaultTodayDueAt, taskBelongsToView } from "../lib/date";
import { createId } from "../lib/ids";
import type { SmartView, Task, TaskPriority, TaskTag } from "../types/task";

type TaskStoreState = {
  tasks: Task[];
  tags: TaskTag[];
  activeView: SmartView;
  activeTagId: string | null;
  recentTaskIds: string[];
};

const storageKey = "todoless.task-store.v1";

const initialState: TaskStoreState = {
  tasks: seedTasks,
  tags: seedTags,
  activeView: "inbox",
  activeTagId: null,
  recentTaskIds: seedTasks.slice(0, 10).map((task) => task.id),
};

let state = loadState();
const listeners = new Set<() => void>();

function loadState(): TaskStoreState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return initialState;
    return { ...initialState, ...JSON.parse(raw) };
  } catch {
    return initialState;
  }
}

function emit(next: TaskStoreState) {
  state = next;
  localStorage.setItem(storageKey, JSON.stringify(state));
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return state;
}

export function useTaskStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useVisibleTasks() {
  const current = useTaskStore();

  return useMemo(() => {
    const openTasks = current.tasks.filter((task) => {
      if (current.activeTagId) {
        return task.status === "open" && task.tags.some((tag) => tag.id === current.activeTagId);
      }

      return taskBelongsToView(task, current.activeView);
    });
    const doneTasks = current.tasks.filter((task) => task.status === "done");

    return {
      openTasks,
      doneTasks,
    };
  }, [current]);
}

export function setActiveView(activeView: SmartView) {
  emit({ ...state, activeView, activeTagId: null });
}

export function setActiveTag(activeTagId: string) {
  emit({ ...state, activeView: "all", activeTagId });
}

export function toggleTask(id: string) {
  const now = new Date().toISOString();
  emit({
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            status: task.status === "done" ? "open" : "done",
            completedAt: task.status === "done" ? null : now,
            updatedAt: now,
          }
        : task,
    ),
  });
}

export function createTask(title: string) {
  const now = new Date().toISOString();
  const dueAt = createDefaultTodayDueAt();
  const task: Task = {
    id: createId(),
    title,
    content: null,
    status: "open",
    dueAt,
    reminderAt: createDefaultReminderAt(dueAt),
    priority: 1,
    tags: [],
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };

  emit({
    ...state,
    tasks: [task, ...state.tasks],
    recentTaskIds: [task.id, ...state.recentTaskIds].slice(0, 10),
  });
}

export function updateTaskPriority(id: string, priority: TaskPriority) {
  const now = new Date().toISOString();
  emit({
    ...state,
    tasks: state.tasks.map((task) => (task.id === id ? { ...task, priority, updatedAt: now } : task)),
  });
}
