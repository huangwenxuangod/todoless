import { CalendarDays, Inbox, X } from "lucide-react";
import { useRef } from "react";
import { useDismissableLayer } from "../../hooks/useDismissableLayer";
import type { Task } from "../../types/task";
import { TaskCheckbox } from "./TaskParts";

function formatDetailDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const time = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const dayLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : "";
  return `${month} ${day}${dayLabel ? ", " + dayLabel : ""}, ${time}`;
}

export function TaskDetailCard({ onClose, task }: { onClose: () => void; task: Task }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useDismissableLayer(panelRef, onClose);

  const dateText = formatDetailDate(task.reminderAt ?? task.dueAt);

  return (
    <div className="task-card-overlay">
      <div ref={panelRef} className="task-card">
        <div className="task-card-header">
          <TaskCheckbox task={task} />

          {dateText ? (
            <span className="task-card-date">
              <CalendarDays size={14} />
              {dateText}
            </span>
          ) : (
            <span />
          )}

          <button aria-label="Close" className="task-card-close" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div className="task-card-body">
          <div className="task-card-title">{task.title}</div>
          {task.content ? <div className="task-card-content">{task.content}</div> : null}
        </div>

        {task.tags.length > 0 ? (
          <div className="task-card-footer">
            <span className="task-card-source">
              <Inbox size={14} />
              {task.tags.map((t) => t.name).join(", ")}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
