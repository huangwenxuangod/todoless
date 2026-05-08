import { CalendarDays, Inbox, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { toggleTask } from "../../stores/taskStore";
import type { Task } from "../../types/task";

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

const priorityClass: Record<number, string> = {
  0: "priority-none",
  1: "priority-low",
  2: "priority-medium",
  3: "priority-high",
};

export function TaskDetailCard({ onClose, task }: { onClose: () => void; task: Task }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    function handleClick(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const dateText = formatDetailDate(task.reminderAt ?? task.dueAt);

  return (
    <div className="task-card-overlay">
      <div ref={panelRef} className="task-card">
        <div className="task-card-header">
          <button
            aria-label={task.status === "done" ? "Mark open" : "Complete"}
            className={`check-indicator ${priorityClass[task.priority]} ${task.status === "done" ? "done" : ""}`}
            onClick={() => void toggleTask(task.id)}
            type="button"
          >
            {task.status === "done" ? "✓" : null}
          </button>

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
