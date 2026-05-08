import type React from "react";
import { Minus, Settings, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function WindowChrome() {
  const window = getCurrentWindow();
  const startDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest("button")) return;
    void window.startDragging();
  };

  return (
    <header className="window-chrome" onPointerDown={startDrag}>
      <div className="chrome-brand">
        <span className="brand-mark">tl</span>
        <span className="brand-name">todoless</span>
      </div>
      <button className="chrome-settings" title="Settings" type="button" onPointerDown={(event) => event.stopPropagation()}>
        <Settings size={17} />
      </button>
      <button className="chrome-button" aria-label="Minimize" onClick={() => void window.minimize()} onPointerDown={(event) => event.stopPropagation()} type="button">
        <Minus size={18} />
      </button>
      <button className="chrome-button" aria-label="Maximize" onClick={() => void window.toggleMaximize()} onPointerDown={(event) => event.stopPropagation()} type="button">
        <Square size={15} />
      </button>
      <button className="chrome-button close" aria-label="Close" onClick={() => void window.hide()} onPointerDown={(event) => event.stopPropagation()} type="button">
        <X size={18} />
      </button>
    </header>
  );
}
