import { Mic } from "lucide-react";
import type { VoiceState } from "../../hooks/useVoiceCapture";

export function VoiceWidget({ message, onToggle, state }: { message: string; onToggle: () => void; state: VoiceState }) {
  return (
    <button className={`voice-widget ${state}`} onClick={onToggle} type="button" title="Ctrl + Shift + Space">
      <span className="voice-widget-dot">
        <Mic size={18} />
      </span>
      <span className="voice-widget-text">{message}</span>
      {state === "recording" ? <i className="voice-meter" /> : null}
    </button>
  );
}
