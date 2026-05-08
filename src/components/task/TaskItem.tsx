import { Clock3 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { formatTaskTime } from "../../lib/date";
import { toggleTask } from "../../stores/taskStore";
import type { Task, TaskPriority } from "../../types/task";

const priorityClass: Record<TaskPriority, string> = {
  0: "priority-none",
  1: "priority-low",
  2: "priority-medium",
  3: "priority-high",
};

export function TaskItem({ isCompletedPreview, task }: { isCompletedPreview?: boolean; task: Task }) {
  const [expanded, setExpanded] = useState(false);

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
      <TaskBody expanded={expanded} onToggle={() => setExpanded((value) => !value)} task={task} />
      <TaskMeta task={task} />
    </motion.article>
  );
}

function TaskCheckbox({ task }: { task: Task }) {
  return (
    <button
      aria-label={task.status === "done" ? "Mark task open" : "Complete task"}
      className={`check-box ${priorityClass[task.priority]} ${task.status === "done" ? "done" : ""}`}
      onClick={() => void toggleTask(task.id)}
      type="button"
    >
      {task.status === "done" ? "✓" : null}
    </button>
  );
}

function TaskBody({ expanded, onToggle, task }: { expanded: boolean; onToggle: () => void; task: Task }) {
  return (
    <button className="task-main" onClick={onToggle} type="button">
      <span className="task-title">{task.title}</span>
      {expanded && task.content ? <span className="task-content">{task.content}</span> : null}
      {expanded ? <span className="task-ai-hint">AI can refine this task from your next voice correction.</span> : null}
    </button>
  );
}

function TaskMeta({ task }: { task: Task }) {
  const visibleTags = task.tags.slice(0, 1);
  const hiddenTagCount = Math.max(task.tags.length - visibleTags.length, 0);

  return (
    <div className="task-meta">
      {visibleTags.map((tag) => (
        <span className="tag-chip" key={tag.id} style={{ "--tag-color": tag.color } as React.CSSProperties}>
          {tag.name}
        </span>
      ))}
      {hiddenTagCount > 0 ? <span className="tag-more">+{hiddenTagCount}</span> : null}
      {task.reminderAt ? <Clock3 className="meta-icon" size={17} /> : null}
      {task.dueAt ? <span className="task-time">{formatTaskTime(task.reminderAt ?? task.dueAt)}</span> : null}
    </div>
  );
}
