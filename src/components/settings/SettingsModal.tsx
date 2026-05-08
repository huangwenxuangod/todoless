import { Monitor, Moon, Sun, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useThemeStore, setThemeMode } from "../../stores/themeStore";
import type { ThemeMode } from "../../stores/themeStore";

const options: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Light", icon: Sun },
  { mode: "dark", label: "Dark", icon: Moon },
  { mode: "system", label: "System", icon: Monitor },
];

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { mode } = useThemeStore();
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
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button aria-label="Close" className="settings-close" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div className="settings-section">
          <span className="settings-label">Appearance</span>
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
        </div>
      </div>
    </div>
  );
}
