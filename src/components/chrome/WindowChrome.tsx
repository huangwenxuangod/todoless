import type React from "react";
import { Minus, Maximize2, X } from "lucide-react";
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
      <span className="brand-mark">tl</span>

      <div className="window-controls">
        <button
          aria-label="Minimize"
          className="chrome-button"
          onClick={() => void window.minimize()}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          <Minus size={10} strokeWidth={2.5} />
        </button>
        <button
          aria-label="Maximize"
          className="chrome-button"
          onClick={() => void window.toggleMaximize()}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          <Maximize2 size={9} strokeWidth={2.5} />
        </button>
        <button
          aria-label="Close"
          className="chrome-button close"
          onClick={() => void window.hide()}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
