import { useMemo, useSyncExternalStore } from "react";
import { createDefaultTodayDueAt, createNextRepeatDate, taskBelongsToView, taskMatchesView } from "@todoless/shared/lib/date";
import { createId } from "@todoless/shared/lib/ids";
import { initializeDb, insertTask, loadTasksAndTags, recordEvent, softDeleteTask, updateTask, upsertTag } from "../services/db";
import { showToast } from "./toastStore";
import type { AgentTarget, AgentTaskPatch } from "@todoless/shared/types/agent";
import type { RepeatRule, SmartView, Task, TaskPriority, TaskStatus, TaskTag } from "@todoless/shared/types/task";

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

export async function executeAgentCommand(command: import("../services/voiceAgent").VoiceCommand, transcript: string) {
  if (command.intent === "create_tasks") {
    const created = await createTasksFromAgent(command.tasks, transcript);
    await recordEvent("voice.command.executed", { transcript, intent: command.intent, count: created.length });
    return {
      count: created.length,
      message: `Created ${created.length} task${created.length > 1 ? "s" : ""}`,
    };
  }

  await recordEvent("voice.transcript", { transcript, intent: command.intent });

  if (command.intent === "update_tasks") {
    const updated = await applyTaskUpdates(command.updates, "voice.task.updated");
    return { count: updated, message: `Updated ${updated} task${updated > 1 ? "s" : ""}` };
  }

  if (command.intent === "complete_tasks") {
    let completed = 0;
    for (const target of command.targets) {
      const task = resolveTaskTarget(target);
      if (task && task.status === "open") {
        await toggleTask(task.id);
        completed += 1;
      }
    }
    return { count: completed, message: `Completed ${completed} task${completed > 1 ? "s" : ""}` };
  }

  if (command.intent === "delete_tasks") {
    let deleted = 0;
    for (const target of command.targets) {
      const task = resolveTaskTarget(target);
      if (task) {
        await deleteTask(task.id);
        deleted += 1;
      }
    }
    return { count: deleted, message: `Deleted ${deleted} task${deleted > 1 ? "s" : ""}` };
  }

  if (command.intent === "set_reminders") {
    const updated = await applyTaskUpdates(
      command.updates.map((update) => ({
        target: update.target,
        patch: { reminderAt: update.reminderAt },
      })),
      "voice.reminder.updated",
    );
    return { count: updated, message: updated === 1 ? "Reminder updated" : `Updated ${updated} reminders` };
  }

  if (command.intent === "set_repeat") {
    const updated = await applyTaskUpdates(
      command.updates.map((update) => ({
        target: update.target,
        patch: { repeatRule: update.repeatRule },
      })),
      "voice.repeat.updated",
    );
    return { count: updated, message: updated === 1 ? "Repeat updated" : `Updated ${updated} repeats` };
  }

  return { count: 0, message: "No task changed" };
}

export async function updateTaskPriority(id: string, priority: TaskPriority) {
  const now = new Date().toISOString();
  const nextTasks = state.tasks.map((task) => (task.id === id ? { ...task, priority, updatedAt: now } : task));
  emit({ ...state, tasks: nextTasks });
  const task = nextTasks.find((item) => item.id === id);
  if (task) await updateTask(task, "task.priority.updated", { id, priority });
}

export async function updateTaskFields(id: string, patch: AgentTaskPatch, eventType = "task.updated") {
  const current = state.tasks.find((task) => task.id === id);
  if (!current) return null;
  const next = await buildPatchedTask(current, patch);
  emit({
    ...state,
    tasks: state.tasks.map((task) => (task.id === id ? next : task)),
    tags: mergeTags(state.tags, next.tags),
    recentTaskIds: [id, ...state.recentTaskIds.filter((taskId) => taskId !== id)].slice(0, 10),
  });
  await updateTask(next, eventType, { id, patch });
  return next;
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

async function applyTaskUpdates(updates: Array<{ target: AgentTarget; patch: AgentTaskPatch }>, eventType: string) {
  let updated = 0;
  for (const update of updates) {
    const task = resolveTaskTarget(update.target);
    if (!task) continue;
    const next = await updateTaskFields(task.id, update.patch, eventType);
    if (next) updated += 1;
  }
  return updated;
}

async function buildPatchedTask(task: Task, patch: AgentTaskPatch): Promise<Task> {
  const tags = patch.tags ? await resolveTags(patch.tags) : task.tags;
  return {
    ...task,
    title: patch.title ?? task.title,
    content: patch.content === undefined ? task.content : patch.content,
    dueAt: patch.dueAt === undefined ? task.dueAt : patch.dueAt,
    reminderAt: patch.reminderAt === undefined ? task.reminderAt : patch.reminderAt,
    priority: patch.priority ?? task.priority,
    repeatRule: normalizeRepeatRule(patch.repeatRule ?? task.repeatRule),
    tags,
    updatedAt: new Date().toISOString(),
  };
}

async function resolveTags(tagNames: string[]) {
  const tags: TaskTag[] = [];
  for (const name of tagNames) {
    if (!name.trim()) continue;
    tags.push(await upsertTag(name.trim()));
  }
  return tags;
}

function resolveTaskTarget(target: AgentTarget): Task | null {
  const openFirst = [...state.tasks].sort((left, right) => {
    if (left.status !== right.status) return left.status === "open" ? -1 : 1;
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });

  if (target.ordinal) {
    const recentMatches = state.recentTaskIds
      .map((id) => state.tasks.find((task) => task.id === id))
      .filter((task): task is Task => Boolean(task));
    return recentMatches[target.ordinal - 1] ?? openFirst[target.ordinal - 1] ?? null;
  }

  if (target.recent) {
    const recent = state.recentTaskIds
      .map((id) => state.tasks.find((task) => task.id === id))
      .find((task): task is Task => Boolean(task));
    if (recent) return recent;
  }

  if (target.query?.trim()) {
    const query = normalizeText(target.query);
    const scored = state.tasks
      .map((task) => ({ task, score: scoreTaskMatch(task, query) }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score || new Date(right.task.updatedAt).getTime() - new Date(left.task.updatedAt).getTime());
    return scored[0]?.task ?? null;
  }

  return openFirst[0] ?? null;
}

function scoreTaskMatch(task: Task, query: string) {
  const title = normalizeText(task.title);
  const content = normalizeText(task.content ?? "");
  const tags = normalizeText(task.tags.map((tag) => tag.name).join(" "));
  let score = 0;
  if (title === query) score += 100;
  if (title.includes(query)) score += 60;
  if (query.includes(title) && title.length > 2) score += 35;
  if (content.includes(query)) score += 20;
  if (tags.includes(query)) score += 24;
  if (task.status === "open") score += 8;
  if (state.recentTaskIds.includes(task.id)) score += 10 - state.recentTaskIds.indexOf(task.id);
  return score;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function normalizeRepeatRule(rule: RepeatRule): RepeatRule {
  if (rule.type === "daily") return { type: "daily", interval: 1 };
  if (rule.type === "weekly") return { type: "weekly", interval: 1 };
  return { type: "none" };
}
