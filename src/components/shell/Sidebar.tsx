import { Calendar1, CalendarDays, Inbox, ListChecks, Tag } from "lucide-react";
import { useMemo } from "react";
import { isSameDay, isWithinNext7Days } from "../../lib/date";
import { setActiveTag, setActiveView, useTaskStore } from "../../stores/taskStore";
import type { SmartView } from "../../types/task";

export function Sidebar() {
  const store = useTaskStore();

  const counts = useMemo(() => {
    return {
      today: store.tasks.filter((task) => task.status === "open" && isSameDay(task.dueAt, new Date())).length,
      next7: store.tasks.filter((task) => task.status === "open" && isWithinNext7Days(task.dueAt)).length,
      inbox: store.tasks.filter((task) => task.status === "open" && !task.dueAt).length,
    };
  }, [store.tasks]);

  return (
    <aside className="sidebar">
      <nav className="smart-list" aria-label="Smart lists">
        <SidebarView icon={Calendar1} id="today" label="Today" count={counts.today} />
        <SidebarView icon={CalendarDays} id="next7" label="Next 7 Days" count={counts.next7} />
        <SidebarView icon={Inbox} id="inbox" label="Inbox" count={counts.inbox} />
      </nav>
      <div className="divider" />
      <section className="sidebar-section">
        <h2>Lists</h2>
        <div className="muted-card">Use lists to categorize and manage your tasks and notes</div>
      </section>
      <section className="sidebar-section tags-section">
        <h2>Tags</h2>
        {store.tags.map((tag) => (
          <button
            className={store.activeTagId === tag.id ? "tag-link active" : "tag-link"}
            key={tag.id}
            onClick={() => setActiveTag(tag.id)}
            type="button"
          >
            <Tag size={25} />
            <span>{tag.name}</span>
            <i style={{ background: tag.color }} />
            <strong>{store.tasks.filter((task) => task.status === "open" && task.tags.some((item) => item.id === tag.id)).length || ""}</strong>
          </button>
        ))}
      </section>
      <section className="sidebar-section">
        <h2>Filters</h2>
        <div className="muted-card">Display tasks filtered by list, date, priority, tag, and more</div>
      </section>
      <div className="divider" />
      <button className="completed-link" type="button">
        <ListChecks size={24} />
        Completed
      </button>
    </aside>
  );
}

function SidebarView({
  count,
  icon: Icon,
  id,
  label,
}: {
  count: number;
  icon: typeof Inbox;
  id: SmartView;
  label: string;
}) {
  const store = useTaskStore();

  return (
    <button className={store.activeView === id && !store.activeTagId ? "sidebar-view active" : "sidebar-view"} onClick={() => setActiveView(id)} type="button">
      <Icon size={24} />
      <span>{label}</span>
      <strong>{count}</strong>
    </button>
  );
}
