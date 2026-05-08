import { ChevronDown, ChevronRight } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { TaskItem } from "./TaskItem";
import type { Task } from "../../types/task";

export function TaskList({ doneTasks, openTasks }: { doneTasks: Task[]; openTasks: Task[] }) {
  const [showCompleted, setShowCompleted] = useState(true);

  return (
    <>
      <div className="task-list" role="list">
        <AnimatePresence initial={false}>
          {openTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </AnimatePresence>
      </div>

      <button className="completed-toggle" onClick={() => setShowCompleted((value) => !value)} type="button">
        {showCompleted ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        <span>Completed</span>
        <strong>{doneTasks.length}</strong>
      </button>

      {showCompleted ? (
        <div className="completed-list">
          {doneTasks.slice(0, 5).map((task) => (
            <TaskItem isCompletedPreview key={task.id} task={task} />
          ))}
        </div>
      ) : null}
    </>
  );
}
