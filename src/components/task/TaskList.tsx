import { ChevronDown, ChevronRight } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { TaskItem } from "./TaskItem";
import type { Task } from "../../types/task";

type CompletedGroup = {
  key: string;
  label: string;
  tasks: Task[];
};

export function TaskList({
  doneTasks,
  onSelectTask,
  openTasks,
}: {
  doneTasks: Task[];
  onSelectTask?: (id: string) => void;
  openTasks: Task[];
}) {
  const [showCompleted, setShowCompleted] = useState(true);
  const completedGroups = groupCompletedTasks(doneTasks);
  const shouldShowDateLabels = completedGroups.length > 1;

  return (
    <>
      <div className="task-list" role="list">
        <AnimatePresence initial={false}>
          {openTasks.map((task) => (
            <TaskItem key={task.id} onSelect={onSelectTask} task={task} />
          ))}
        </AnimatePresence>
      </div>

      {doneTasks.length > 0 ? (
        <div className="completed-section">
          <button
            className="completed-toggle"
            onClick={() => setShowCompleted((value) => !value)}
            type="button"
          >
            {showCompleted ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Completed</span>
            <strong>{doneTasks.length}</strong>
          </button>

          {showCompleted ? (
            <div className="completed-list">
              {completedGroups.map((group) => (
                <section className="completed-date-group" key={group.key}>
                  {shouldShowDateLabels ? <div className="completed-date-label">{group.label}</div> : null}
                  {group.tasks.map((task) => (
                    <TaskItem isCompletedPreview key={task.id} onSelect={onSelectTask} task={task} />
                  ))}
                </section>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function groupCompletedTasks(tasks: Task[]): CompletedGroup[] {
  const groups = new Map<string, CompletedGroup>();
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sorted = [...tasks].sort((a, b) => {
    const left = new Date(a.completedAt ?? a.updatedAt).getTime();
    const right = new Date(b.completedAt ?? b.updatedAt).getTime();
    return right - left;
  });

  for (const task of sorted) {
    const completedDate = new Date(task.completedAt ?? task.updatedAt);
    const key = startOfDay(completedDate).toISOString();
    const existing = groups.get(key);
    if (existing) {
      existing.tasks.push(task);
      continue;
    }

    groups.set(key, {
      key,
      label: formatCompletedDate(completedDate, today, yesterday),
      tasks: [task],
    });
  }

  return [...groups.values()];
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatCompletedDate(date: Date, today: Date, yesterday: Date) {
  const start = startOfDay(date);
  if (start.getTime() === today.getTime()) return "Today";
  if (start.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
}
