import { Clock3, Repeat2 } from "lucide-react";
import { formatTaskTime } from "@todoless/shared/lib/date";
import { toggleTask } from "../../stores/taskStore";
import type { Task, TaskPriority } from "@todoless/shared/types/task";

export const priorityClass: Record<TaskPriority, string> = {
  0: "priority-none",
  1: "priority-low",
  2: "priority-medium",
  3: "priority-high",
};

export function TaskCheckbox({
  className = "check-indicator",
  showDoneMark = true,
  task,
}: {
  className?: string;
  showDoneMark?: boolean;
  task: Task;
}) {
  return (
    <button
      aria-label={task.status === "done" ? "Mark task open" : "Complete task"}
      className={`${className} ${priorityClass[task.priority]} ${task.status === "done" ? "done" : ""}`}
      onClick={() => void toggleTask(task.id)}
      type="button"
    >
      {showDoneMark && task.status === "done" ? "✓" : null}
    </button>
  );
}

export function TaskMetaRow({
  className = "task-meta-row",
  moreClassName = "tag-more",
  showClock = true,
  tagClassName = "task-tag",
  tagLimit = 2,
  task,
  timeClassName = "task-time",
}: {
  className?: string;
  moreClassName?: string;
  showClock?: boolean;
  tagClassName?: string;
  tagLimit?: number;
  task: Task;
  timeClassName?: string;
}) {
  const visibleTags = task.tags.slice(0, tagLimit);
  const hiddenTagCount = Math.max(task.tags.length - visibleTags.length, 0);

  return (
    <div className={className}>
      {visibleTags.map((tag) => (
        <span className={tagClassName} key={tag.id} style={{ "--tag-color": tag.color } as React.CSSProperties}>
          {tag.name}
        </span>
      ))}
      {hiddenTagCount > 0 ? <span className={moreClassName}>+{hiddenTagCount}</span> : null}
      {task.dueAt ? (
        <span className={timeClassName}>
          {showClock ? <Clock3 size={11} style={{ verticalAlign: "middle", opacity: 0.6 }} /> : null}
          {formatTaskTime(task.reminderAt ?? task.dueAt)}
        </span>
      ) : null}
      {task.repeatRule.type !== "none" ? (
        <span className={timeClassName} title={task.repeatRule.type === "daily" ? "Repeats daily" : "Repeats weekly"}>
          <Repeat2 size={11} style={{ verticalAlign: "middle", opacity: 0.6 }} />
          {task.repeatRule.type === "daily" ? "Daily" : "Weekly"}
        </span>
      ) : null}
    </div>
  );
}
