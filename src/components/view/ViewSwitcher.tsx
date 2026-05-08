import { Archive, Calendar1, CalendarDays, ChevronDown, Inbox, Tag, TimerReset } from "lucide-react";
import { useMemo, useState } from "react";
import { setActiveView, useTaskStore } from "../../stores/taskStore";
import type { SmartView } from "../../types/task";

const viewLabels: Record<SmartView, string> = {
  all: "All",
  today: "Today",
  tomorrow: "Tomorrow",
  next7: "Next 7 Days",
  inbox: "Inbox",
};

const viewIcons: Record<SmartView, typeof Inbox> = {
  all: Archive,
  today: Calendar1,
  tomorrow: TimerReset,
  next7: CalendarDays,
  inbox: Inbox,
};

const switchableViews: SmartView[] = ["today", "tomorrow", "next7", "inbox"];

export function ViewSwitcher() {
  const store = useTaskStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentTitle = useMemo(() => {
    if (store.activeTagId) {
      return store.tags.find((tag) => tag.id === store.activeTagId)?.name ?? "Tag";
    }
    return viewLabels[store.activeView];
  }, [store.activeTagId, store.activeView, store.tags]);

  const ActiveIcon = store.activeTagId ? Tag : viewIcons[store.activeView];

  return (
    <div className="title-wrap">
      <button className="view-title" onClick={() => setIsOpen((value) => !value)} type="button">
        <ActiveIcon size={18} />
        <span>{currentTitle}</span>
        <ChevronDown size={18} />
      </button>
      {isOpen ? <ViewMenu activeView={store.activeView} onClose={() => setIsOpen(false)} /> : null}
    </div>
  );
}

function ViewMenu({ activeView, onClose }: { activeView: SmartView; onClose: () => void }) {
  return (
    <div className="view-menu">
      {switchableViews.map((view) => {
        const Icon = viewIcons[view];
        return (
          <button
            className={activeView === view ? "view-menu-item active" : "view-menu-item"}
            key={view}
            onClick={() => {
              setActiveView(view);
              onClose();
            }}
            type="button"
          >
            <Icon size={14} />
            <span>{viewLabels[view]}</span>
          </button>
        );
      })}
    </div>
  );
}
