import { Mic2, Monitor, Moon, Settings, Sun, UserCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type React from "react";
import {
  cancelSenseVoiceDownload,
  deleteSenseVoiceModel,
  downloadSenseVoiceModel,
  formatBytes,
  getSenseVoiceStatus,
  onSenseVoiceProgress,
  type SenseVoiceProgress,
  type SenseVoiceSource,
  type SenseVoiceStatus,
} from "../../services/senseVoiceModel";
import {
  setAsrModel,
  setDefaultDueTime,
  setMainAlwaysOnTop,
  setShortcut,
  setTextModel,
  setWidgetAlwaysOnTop,
  useAppSettings,
} from "../../stores/settingsStore";
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
  const settings = useAppSettings();
  const [capturingShortcut, setCapturingShortcut] = useState(false);

  const captureShortcut = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!capturingShortcut) return;
    event.preventDefault();
    const shortcut = formatShortcut(event);
    if (!shortcut) return;
    void setShortcut(shortcut);
    setCapturingShortcut(false);
  };

  return (
    <section className="settings-pane">
      <h2>General</h2>
      <p>Desktop capture defaults.</p>
      <div className="settings-row">
        <span>Main always on top</span>
        <button
          aria-pressed={settings.mainAlwaysOnTop}
          className={settings.mainAlwaysOnTop ? "settings-toggle active" : "settings-toggle"}
          onClick={() => void setMainAlwaysOnTop(!settings.mainAlwaysOnTop)}
          type="button"
        >
          <i />
        </button>
      </div>
      <div className="settings-row">
        <span>Widget always on top</span>
        <button
          aria-pressed={settings.widgetAlwaysOnTop}
          className={settings.widgetAlwaysOnTop ? "settings-toggle active" : "settings-toggle"}
          onClick={() => void setWidgetAlwaysOnTop(!settings.widgetAlwaysOnTop)}
          type="button"
        >
          <i />
        </button>
      </div>
      <div className="settings-row">
        <span>Global shortcut</span>
        <button
          className={capturingShortcut ? "settings-value-button recording" : "settings-value-button"}
          onBlur={() => setCapturingShortcut(false)}
          onClick={() => setCapturingShortcut(true)}
          onKeyDown={captureShortcut}
          type="button"
        >
          {capturingShortcut ? "Press shortcut..." : settings.shortcut.replaceAll("+", " ")}
        </button>
      </div>
      <div className="settings-row">
        <span>Close behavior</span>
        <strong>Hide to tray</strong>
      </div>
      <div className="settings-row">
        <span>Default due time</span>
        <input
          className="settings-time-input"
          onChange={(event) => setDefaultDueTime(event.target.value)}
          type="time"
          value={settings.defaultDueTime}
        />
      </div>
    </section>
  );
}

function formatShortcut(event: React.KeyboardEvent) {
  const key = normalizeShortcutKey(event.code, event.key);
  if (!key) return null;
  const parts = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.shiftKey) parts.push("Shift");
  if (event.altKey) parts.push("Alt");
  if (event.metaKey) parts.push("Meta");
  parts.push(key);
  return parts.join("+");
}

function normalizeShortcutKey(code: string, key: string) {
  if (code === "Space") return "Space";
  if (code.startsWith("Key")) return code.slice(3).toUpperCase();
  if (code.startsWith("Digit")) return code.slice(5);
  if (["Enter", "Escape", "Tab", "Backspace"].includes(code)) return code;
  if (key.length === 1) return key.toUpperCase();
  return null;
}

function VoicePane() {
  const settings = useAppSettings();
  const [source, setSource] = useState<SenseVoiceSource>("modelscope");
  const [status, setStatus] = useState<SenseVoiceStatus | null>(null);
  const [progress, setProgress] = useState<SenseVoiceProgress | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    void getSenseVoiceStatus().then(setStatus);
    const promise = onSenseVoiceProgress(setProgress);
    return () => {
      void promise.then((unlisten) => unlisten());
    };
  }, []);

  const startDownload = async () => {
    setDownloading(true);
    setProgress(null);
    try {
      setStatus(await downloadSenseVoiceModel(source));
    } finally {
      setDownloading(false);
    }
  };

  const deleteModel = async () => {
    setStatus(await deleteSenseVoiceModel());
    setProgress(null);
  };

  return (
    <section className="settings-pane">
      <h2>Voice Model</h2>
      <p>Voice is captured locally, then routed to the selected transcription model.</p>
      <div className="settings-choice-group">
        <span>Speech to text</span>
        <button
          className={settings.asrModel === "openai/whisper-large-v3-turbo" ? "settings-choice active" : "settings-choice"}
          onClick={() => setAsrModel("openai/whisper-large-v3-turbo")}
          type="button"
        >
          <strong>Whisper Large V3 Turbo</strong>
          <small>Remote · Auto language</small>
        </button>
        <button
          className={settings.asrModel === "openai/whisper-1" ? "settings-choice active" : "settings-choice"}
          onClick={() => setAsrModel("openai/whisper-1")}
          type="button"
        >
          <strong>Whisper 1</strong>
          <small>Remote · Fallback</small>
        </button>
        <button className="settings-choice disabled" disabled type="button">
          <strong>SenseVoice Small</strong>
          <small>Local · {status?.installed ? `Installed · ${formatBytes(status.totalBytes)}` : "Not installed · 229 MB"}</small>
        </button>
      </div>
      <div className="model-manager">
        <div className="model-source-row">
          <span>Download source</span>
          <select value={source} onChange={(event) => setSource(event.target.value as SenseVoiceSource)}>
            <option value="modelscope">ModelScope</option>
            <option value="huggingface">Hugging Face</option>
          </select>
        </div>
        {progress ? (
          <div className="model-progress">
            <div>
              <span>{progress.file}</span>
              <strong>{Math.round(progress.percent)}%</strong>
            </div>
            <i style={{ width: `${Math.round(progress.percent)}%` }} />
          </div>
        ) : null}
        <div className="model-actions">
          {status?.installed ? (
            <button className="settings-secondary-button" onClick={() => void deleteModel()} type="button">
              Delete model
            </button>
          ) : (
            <button className="settings-secondary-button" disabled={downloading} onClick={() => void startDownload()} type="button">
              {downloading ? "Downloading..." : "Download model"}
            </button>
          )}
          {downloading ? (
            <button className="settings-secondary-button" onClick={() => void cancelSenseVoiceDownload()} type="button">
              Cancel
            </button>
          ) : null}
        </div>
        {status ? <small className="model-path">{status.path}</small> : null}
      </div>
      <div className="settings-choice-group">
        <span>Task planner</span>
        <button
          className={settings.textModel === "deepseek/deepseek-v4-flash" ? "settings-choice active" : "settings-choice"}
          onClick={() => setTextModel("deepseek/deepseek-v4-flash")}
          type="button"
        >
          <strong>DeepSeek V4 Flash</strong>
          <small>OpenRouter · Default</small>
        </button>
        <button className="settings-choice disabled" disabled type="button">
          <strong>Local language model</strong>
          <small>Not installed</small>
        </button>
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
