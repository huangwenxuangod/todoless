import { useMemo, useSyncExternalStore } from "react";
import { createDefaultTodayDueAt, createNextRepeatDate, taskBelongsToView, taskMatchesView } from "@todoless/shared/lib/date";
import { createId } from "@todoless/shared/lib/ids";
import { initializeDb, insertTask, loadTasksAndTags, recordEvent, softDeleteTask, updateTask, upsertTag } from "../services/db";
import { showToast } from "./toastStore";
import type { SmartView, Task, TaskPriority, TaskStatus, TaskTag } from "@todoless/shared/types/task";

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
    const doneTasks = current.tasks.filter((task) => {
      if (current.activeTagId) {
        return task.status === "done" && task.tags.some((tag) => tag.id === current.activeTagId);
      }

      return task.status === "done" && taskMatchesView(task, current.activeView);
    });

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
    const message = error instanceof Error ? error.message : String(error);
    showToast(message, "error");
    emit({
      ...state,
      isReady: true,
      error: null,
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
  const current = state.tasks.find((task) => task.id === id);
  if (!current) return;
  const status: TaskStatus = current.status === "done" ? "open" : "done";
  const updatedTask: Task = {
    ...current,
    status,
    completedAt: current.status === "done" ? null : now,
    updatedAt: now,
  };
  const nextRepeatTask = status === "done" ? createNextRepeatTask(updatedTask, now) : null;
  const nextTasks = state.tasks.map((task) => (task.id === id ? updatedTask : task));

  emit({
    ...state,
    tasks: nextRepeatTask ? [nextRepeatTask, ...nextTasks] : nextTasks,
    recentTaskIds: nextRepeatTask ? [nextRepeatTask.id, ...state.recentTaskIds].slice(0, 10) : state.recentTaskIds,
  });

  await updateTask(updatedTask, status === "done" ? "task.completed" : "task.reopened", { id, completedAt: updatedTask.completedAt });
  if (nextRepeatTask) {
    await insertTask(nextRepeatTask, "task.repeat.created");
    showToast("Next repeat created", "success");
  }
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
    repeatRule: { type: "none" },
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
      repeatRule: item.repeatRule,
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

function createNextRepeatTask(task: Task, now: string): Task | null {
  if (task.repeatRule.type === "none") return null;
  const dueAt = createNextRepeatDate(task.dueAt, task.repeatRule);
  const reminderAt = task.reminderAt ? createNextRepeatDate(task.reminderAt, task.repeatRule) : null;
  return {
    ...task,
    id: createId(),
    status: "open",
    dueAt,
    reminderAt,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
}
