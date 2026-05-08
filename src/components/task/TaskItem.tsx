import { Clock3 } from "lucide-react";
import { motion } from "framer-motion";
import { formatTaskTime } from "../../lib/date";
import { toggleTask } from "../../stores/taskStore";
import type { Task, TaskPriority } from "../../types/task";

const priorityClass: Record<TaskPriority, string> = {
  0: "priority-none",
  1: "priority-low",
  2: "priority-medium",
  3: "priority-high",
};

export function TaskItem({ isCompletedPreview, onSelect, task }: { isCompletedPreview?: boolean; onSelect?: (id: string) => void; task: Task }) {
  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className={isCompletedPreview ? "task-row completed-preview" : "task-row"}
      exit={{ opacity: 0, y: -6 }}
      initial={{ opacity: 0, y: 6 }}
      layout
      role="listitem"
    >
      <TaskCheckbox task={task} />
      <TaskBody onSelect={onSelect} task={task} />
    </motion.article>
  );
}

function TaskCheckbox({ task }: { task: Task }) {
  return (
    <button
      aria-label={task.status === "done" ? "Mark task open" : "Complete task"}
      className={`check-indicator ${priorityClass[task.priority]} ${task.status === "done" ? "done" : ""}`}
      onClick={() => void toggleTask(task.id)}
      type="button"
    >
      {task.status === "done" ? "✓" : null}
    </button>
  );
}

function TaskBody({ onSelect, task }: { onSelect?: (id: string) => void; task: Task }) {
  return (
    <button className="task-main" onClick={() => onSelect?.(task.id)} type="button">
      <span className="task-title">{task.title}</span>
      <TaskMetaRow task={task} />
    </button>
  );
}

function TaskMetaRow({ task }: { task: Task }) {
  const visibleTags = task.tags.slice(0, 2);
  const hiddenTagCount = Math.max(task.tags.length - visibleTags.length, 0);

  return (
    <div className="task-meta-row">
      {visibleTags.map((tag) => (
        <span className="task-tag" key={tag.id} style={{ "--tag-color": tag.color } as React.CSSProperties}>
          {tag.name}
        </span>
      ))}
      {hiddenTagCount > 0 ? <span className="tag-more">+{hiddenTagCount}</span> : null}
      {task.dueAt ? (
        <span className="task-time">
          <Clock3 size={11} style={{ verticalAlign: "middle", opacity: 0.6 }} />
          {formatTaskTime(task.reminderAt ?? task.dueAt)}
        </span>
      ) : null}
    </div>
  );
}
