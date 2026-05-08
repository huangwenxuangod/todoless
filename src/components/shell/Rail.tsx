import { Bell, CalendarDays, CheckSquare, CircleHelp, Clock3, Inbox, Search, Target, TimerReset } from "lucide-react";

export function Rail() {
  return (
    <aside className="rail">
      <button className="avatar-button" type="button">
        <span className="avatar-crown">♛</span>
      </button>
      <nav className="rail-nav" aria-label="Workspace">
        <RailButton active icon={CheckSquare} label="Tasks" />
        <RailButton icon={CalendarDays} label="Calendar" />
        <RailButton icon={Target} label="Focus" />
        <RailButton icon={Clock3} label="Timeline" />
        <RailButton icon={Search} label="Search" />
      </nav>
      <nav className="rail-nav bottom" aria-label="Utility">
        <RailButton icon={TimerReset} label="Sync" />
        <RailButton icon={Bell} label="Notifications" />
        <RailButton icon={CircleHelp} label="Help" />
      </nav>
    </aside>
  );
}

function RailButton({ active, icon: Icon, label }: { active?: boolean; icon: typeof Inbox; label: string }) {
  return (
    <button className={active ? "rail-button active" : "rail-button"} title={label} type="button" aria-label={label}>
      <Icon size={28} />
    </button>
  );
}
