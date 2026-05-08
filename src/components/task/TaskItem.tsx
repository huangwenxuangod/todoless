import { motion } from "framer-motion";
import type { Task } from "../../types/task";
import { TaskCheckbox, TaskMetaRow } from "./TaskParts";

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

function TaskBody({ onSelect, task }: { onSelect?: (id: string) => void; task: Task }) {
  return (
    <button className="task-main" onClick={() => onSelect?.(task.id)} type="button">
      <span className="task-title">{task.title}</span>
      <TaskMetaRow task={task} />
    </button>
  );
}
