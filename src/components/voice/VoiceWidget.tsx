import { Mic } from "lucide-react";
import type { VoiceState } from "../../hooks/useVoiceCapture";

export function VoiceWidget({ message, onToggle, state }: { message: string; onToggle: () => void; state: VoiceState }) {
  return (
    <button className={`voice-bar ${state}`} onClick={onToggle} type="button" title={`${message} · Ctrl + Shift + Space`}>
      {state === "recording" ? <i className="voice-meter" /> : null}
      <span className="voice-bar-dot">
        <Mic size={16} />
      </span>
    </button>
  );
}
