import { useMemo, useSyncExternalStore } from "react";
import { createDefaultReminderAt, createDefaultTodayDueAt, taskBelongsToView } from "../lib/date";
import { createId } from "../lib/ids";
import { initializeDb, insertTask, loadTasksAndTags, recordEvent, softDeleteTask, updateTask, upsertTag } from "../services/db";
import type { SmartView, Task, TaskPriority, TaskStatus, TaskTag } from "../types/task";

type TaskStoreState = {
  tasks: Task[];
  tags: TaskTag[];
  activeView: SmartView;
  activeTagId: string | null;
  recentTaskIds: string[];
  isReady: boolean;
  error: string | null;
};

const initialState: TaskStoreState = {
  tasks: [],
  tags: [],
  activeView: "today",
  activeTagId: null,
  recentTaskIds: [],
  isReady: false,
  error: null,
};

let state = initialState;
const listeners = new Set<() => void>();

function emit(next: TaskStoreState) {
  state = next;
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

export async function hydrateTaskStore() {
  try {
    await initializeDb();
    const { tasks, tags } = await loadTasksAndTags();
    emit({
      ...state,
      tasks,
      tags,
      recentTaskIds: tasks.slice(0, 10).map((task) => task.id),
      isReady: true,
      error: null,
    });
  } catch (error) {
    emit({
      ...state,
      isReady: true,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function setActiveView(activeView: SmartView) {
  emit({ ...state, activeView, activeTagId: null });
}

export function setActiveTag(activeTagId: string) {
  emit({ ...state, activeView: "all", activeTagId });
}

export async function toggleTask(id: string) {
  const now = new Date().toISOString();
  const nextTasks: Task[] = state.tasks.map((task) => {
    if (task.id !== id) return task;
    const status: TaskStatus = task.status === "done" ? "open" : "done";
    return {
      ...task,
      status,
      completedAt: task.status === "done" ? null : now,
      updatedAt: now,
    };
  });
  emit({ ...state, tasks: nextTasks });
  const task = nextTasks.find((item) => item.id === id);
  if (task) await updateTask(task, task.status === "done" ? "task.completed" : "task.reopened", { id, completedAt: task.completedAt });
}

export async function createTask(title: string) {
  const now = new Date().toISOString();
  const dueAt = createDefaultTodayDueAt();
  const task: Task = {
    id: createId(),
    title,
    content: null,
    status: "open",
    dueAt,
    reminderAt: null,
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
  await insertTask(task);
}

export async function createTasksFromAgent(tasks: Array<Omit<Task, "id" | "status" | "createdAt" | "updatedAt" | "completedAt">>, transcript: string) {
  const now = new Date().toISOString();
  const created: Task[] = [];
  await recordEvent("voice.transcript", { transcript });

  for (const item of tasks.slice(0, 10)) {
    const tags: TaskTag[] = [];
    for (const tag of item.tags) {
      tags.push(await upsertTag(tag.name, tag.color, tag.id));
    }
    const task: Task = {
      id: createId(),
      title: item.title,
      content: item.content,
      status: "open",
      dueAt: item.dueAt,
      reminderAt: item.reminderAt,
      priority: item.priority,
      tags,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    created.push(task);
    await insertTask(task, "voice.task.created");
  }

  emit({
    ...state,
    tasks: [...created, ...state.tasks],
    tags: mergeTags(state.tags, created.flatMap((task) => task.tags)),
    recentTaskIds: [...created.map((task) => task.id), ...state.recentTaskIds].slice(0, 10),
  });

  return created;
}

export async function updateTaskPriority(id: string, priority: TaskPriority) {
  const now = new Date().toISOString();
  const nextTasks = state.tasks.map((task) => (task.id === id ? { ...task, priority, updatedAt: now } : task));
  emit({ ...state, tasks: nextTasks });
  const task = nextTasks.find((item) => item.id === id);
  if (task) await updateTask(task, "task.priority.updated", { id, priority });
}

export async function deleteTask(id: string) {
  emit({ ...state, tasks: state.tasks.filter((task) => task.id !== id) });
  await softDeleteTask(id);
}

function mergeTags(current: TaskTag[], incoming: TaskTag[]) {
  const map = new Map(current.map((tag) => [tag.id, tag]));
  for (const tag of incoming) {
    map.set(tag.id, tag);
  }
  return [...map.values()].sort((left, right) => left.name.localeCompare(right.name));
}
