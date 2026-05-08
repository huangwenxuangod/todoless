import { ChevronDown, ChevronRight } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { TaskItem } from "./TaskItem";
import type { Task } from "../../types/task";

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
              {doneTasks.slice(0, 5).map((task) => (
                <TaskItem isCompletedPreview key={task.id} onSelect={onSelectTask} task={task} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
