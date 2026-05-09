import type { RepeatRule, SmartView, Task } from "../types/task";

const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const isSameDay = (value: string | null, target: Date) => {
  if (!value) return false;
  const date = new Date(value);
  return dayStart(date).getTime() === dayStart(target).getTime();
};

export const isWithinNext7Days = (value: string | null) => {
  if (!value) return false;
  const date = dayStart(new Date(value));
  const today = dayStart(new Date());
  const end = dayStart(addDays(today, 7));
  return date >= today && date <= end;
};

export const taskMatchesView = (task: Task, view: SmartView) => {
  if (view === "all") return true;
  if (view === "today") return isSameDay(task.dueAt, new Date());
  if (view === "tomorrow") return isSameDay(task.dueAt, addDays(new Date(), 1));
  if (view === "next7") return isWithinNext7Days(task.dueAt);
  return true;
};

export const taskBelongsToView = (task: Task, view: SmartView) => task.status === "open" && taskMatchesView(task, view);

export const formatTaskTime = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  if (date.getFullYear() !== now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  }
  if (!isSameDay(value, now) && !isSameDay(value, addDays(now, 1))) {
    return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
  }
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

export const createDefaultTodayDueAt = (time = "22:00") => {
  const date = new Date();
  const [hour = "22", minute = "00"] = time.split(":");
  date.setHours(Number(hour), Number(minute), 0, 0);
  return date.toISOString();
};

export const createDefaultReminderAt = (dueAt = createDefaultTodayDueAt(), hour = 9) => {
  const date = new Date(dueAt);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export const createNextRepeatDate = (value: string | null, repeatRule: RepeatRule) => {
  if (repeatRule.type === "none") return null;
  const date = value ? new Date(value) : new Date();
  if (repeatRule.type === "daily") {
    date.setDate(date.getDate() + repeatRule.interval);
  }
  if (repeatRule.type === "weekly") {
    date.setDate(date.getDate() + 7 * repeatRule.interval);
  }
  return date.toISOString();
};
