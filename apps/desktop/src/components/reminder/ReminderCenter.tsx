import { Bell, Check, Clock3, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { formatTaskTime } from "@todoless/shared/lib/date";
import { getSnapshot, toggleTask, updateTaskFields, useTaskStore } from "../../stores/taskStore";
import { showToast } from "../../stores/toastStore";
import type { Task } from "@todoless/shared/types/task";

type ReminderItem = {
  key: string;
  task: Task;
};

const backfillWindowMs = 24 * 60 * 60 * 1000;
const snoozeMs = 15 * 60 * 1000;

export function ReminderCenter({ onOpenTask }: { onOpenTask?: (id: string) => void }) {
  const store = useTaskStore();
  const [items, setItems] = useState<ReminderItem[]>([]);
  const tasks = store.tasks;

  useEffect(() => {
    const scan = () => {
      const due = findDueReminders(getSnapshot().tasks);
      if (!due.length) return;
      setItems((current) => {
        const existingKeys = new Set(current.map((item) => item.key));
        const next = [...current];
        for (const item of due) {
          if (!existingKeys.has(item.key)) next.push(item);
        }
        return next.slice(-3);
      });
      void surfaceWindow();
    };

    scan();
    const intervalId = window.setInterval(scan, 30_000);
    return () => window.clearInterval(intervalId);
  }, [tasks]);

  const visibleItems = useMemo(() => items.filter((item) => getSnapshot().tasks.some((task) => task.id === item.task.id)), [items, store.tasks]);

  if (!visibleItems.length) return null;

  const dismiss = (key: string) => {
    markReminderHandled(key);
    setItems((current) => current.filter((item) => item.key !== key));
  };

  const complete = async (item: ReminderItem) => {
    await toggleTask(item.task.id);
    dismiss(item.key);
    showToast("Task completed", "success");
  };

  const snooze = async (item: ReminderItem) => {
    const reminderAt = new Date(Date.now() + snoozeMs).toISOString();
    await updateTaskFields(item.task.id, { reminderAt }, "reminder.snoozed");
    dismiss(item.key);
    showToast("Remind again in 15 minutes", "success");
  };

  return (
    <div className="reminder-stack">
      {visibleItems.map((item) => (
        <article className="reminder-card" key={item.key} onClick={() => onOpenTask?.(item.task.id)}>
          <div className="reminder-card-top">
            <span className="reminder-card-icon">
              <Bell size={15} />
            </span>
            <span>{formatTaskTime(item.task.reminderAt ?? item.task.dueAt)}</span>
            <button
              aria-label="Dismiss reminder"
              className="reminder-icon-button"
              onClick={(event) => {
                event.stopPropagation();
                dismiss(item.key);
              }}
              type="button"
            >
              <X size={14} />
            </button>
          </div>
          <h3>{item.task.title}</h3>
          {item.task.content ? <p>{item.task.content}</p> : null}
          <div className="reminder-card-footer">
            <button
              onClick={(event) => {
                event.stopPropagation();
                void complete(item);
              }}
              type="button"
            >
              <Check size={14} />
              Done
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                void snooze(item);
              }}
              type="button"
            >
              <Clock3 size={14} />
              Later
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function findDueReminders(tasks: Task[]) {
  const now = Date.now();
  const earliest = now - backfillWindowMs;
  return tasks
    .filter((task) => {
      if (task.status !== "open" || !task.reminderAt) return false;
      const time = new Date(task.reminderAt).getTime();
      return time <= now && time >= earliest && !isReminderHandled(reminderKey(task));
    })
    .sort((left, right) => new Date(left.reminderAt ?? 0).getTime() - new Date(right.reminderAt ?? 0).getTime())
    .slice(0, 3)
    .map((task) => ({ key: reminderKey(task), task }));
}

function reminderKey(task: Task) {
  return `todoless-reminder:${task.id}:${task.reminderAt ?? ""}`;
}

function isReminderHandled(key: string) {
  return window.localStorage.getItem(key) === "handled";
}

function markReminderHandled(key: string) {
  window.localStorage.setItem(key, "handled");
}

async function surfaceWindow() {
  try {
    const window = getCurrentWindow();
    await window.show();
    await window.unminimize();
    await window.setFocus();
  } catch {
    // Reminder display still works when focus calls are blocked by the OS.
  }
}
