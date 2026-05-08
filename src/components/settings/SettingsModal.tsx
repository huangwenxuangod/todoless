import { Mic2, Monitor, Moon, Settings, Sun, UserCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useThemeStore, setThemeMode } from "../../stores/themeStore";
import type { ThemeMode } from "../../stores/themeStore";

type SettingsTab = "theme" | "general" | "voice" | "account";

const options: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Light", icon: Sun },
  { mode: "dark", label: "Dark", icon: Moon },
  { mode: "system", label: "System", icon: Monitor },
];

const tabs: Array<{ id: SettingsTab; label: string; icon: typeof Sun }> = [
  { id: "theme", label: "Theme", icon: Moon },
  { id: "general", label: "General", icon: Settings },
  { id: "voice", label: "Voice Model", icon: Mic2 },
  { id: "account", label: "Account", icon: UserCircle },
];

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { mode } = useThemeStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("theme");
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

  return (
    <div className="settings-overlay">
      <div ref={panelRef} className="settings-panel">
        <aside className="settings-nav">
          <div className="settings-nav-title">Settings</div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                className={activeTab === tab.id ? "settings-nav-item active" : "settings-nav-item"}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        <div className="settings-content">
          <button aria-label="Close" className="settings-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
          {activeTab === "theme" ? <ThemePane mode={mode} /> : null}
          {activeTab === "general" ? <GeneralPane /> : null}
          {activeTab === "voice" ? <VoicePane /> : null}
          {activeTab === "account" ? <AccountPane /> : null}
        </div>
      </div>
    </div>
  );
}

function ThemePane({ mode }: { mode: ThemeMode }) {
  return (
    <section className="settings-pane">
      <h2>Theme</h2>
      <p>Keep the task panel quiet and readable.</p>
      <div className="theme-options">
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = mode === opt.mode;
          return (
            <button
              className={active ? "theme-option active" : "theme-option"}
              key={opt.mode}
              onClick={() => setThemeMode(opt.mode)}
              type="button"
            >
              <Icon size={16} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function GeneralPane() {
  return (
    <section className="settings-pane">
      <h2>General</h2>
      <p>Desktop capture defaults.</p>
      <div className="settings-row">
        <span>Global shortcut</span>
        <strong>Ctrl Shift Space</strong>
      </div>
      <div className="settings-row">
        <span>Close behavior</span>
        <strong>Hide to tray</strong>
      </div>
      <div className="settings-row">
        <span>Default due time</span>
        <strong>10:00 PM</strong>
      </div>
    </section>
  );
}

function VoicePane() {
  return (
    <section className="settings-pane">
      <h2>Voice Model</h2>
      <p>Voice is captured locally, then sent to the configured model.</p>
      <div className="settings-row">
        <span>ASR</span>
        <strong>Groq Whisper Turbo</strong>
      </div>
      <div className="settings-row">
        <span>Task planner</span>
        <strong>DeepSeek V4 Flash</strong>
      </div>
      <div className="settings-row">
        <span>Max tasks per voice</span>
        <strong>10</strong>
      </div>
    </section>
  );
}

function AccountPane() {
  return (
    <section className="settings-pane">
      <h2>Account</h2>
      <p>Local-only for now. Cloud sync can live here later.</p>
      <div className="settings-row">
        <span>Status</span>
        <strong>Local</strong>
      </div>
    </section>
  );
}
