import { Crown, Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function WindowChrome() {
  const window = getCurrentWindow();

  return (
    <header className="window-chrome" data-tauri-drag-region>
      <div className="chrome-brand" data-tauri-drag-region>
        <span className="brand-mark">tl</span>
        <span className="brand-name">todoless</span>
      </div>
      <div className="chrome-status" title="Pinned mode" data-tauri-drag-region>
        <Crown className="chrome-crown" size={18} />
      </div>
      <button className="chrome-button" aria-label="Minimize" onClick={() => void window.minimize()} type="button">
        <Minus size={18} />
      </button>
      <button className="chrome-button" aria-label="Maximize" onClick={() => void window.toggleMaximize()} type="button">
        <Square size={15} />
      </button>
      <button className="chrome-button close" aria-label="Close" onClick={() => void window.hide()} type="button">
        <X size={18} />
      </button>
    </header>
  );
}
