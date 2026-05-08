import { Keyboard, Mic, Plus } from "lucide-react";
import { useState } from "react";

export function VoiceCaptureBar({
  isRecording,
  onSubmitText,
  onToggleRecording,
}: {
  isRecording: boolean;
  onSubmitText: (title: string) => void;
  onToggleRecording: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);

  const submit = () => {
    const title = draft.trim();
    if (!title) return;
    onSubmitText(title);
    setDraft("");
    setShowTextInput(false);
  };

  return (
    <section className={isRecording ? "voice-capture recording" : "voice-capture"} aria-label="Voice task capture">
      <button className="voice-primary" onClick={onToggleRecording} type="button">
        <span className="voice-primary-icon">
          <Mic size={24} />
        </span>
        <span className="voice-primary-copy">
          <strong>{isRecording ? "Listening..." : "Speak tasks"}</strong>
          <small>{isRecording ? "Click again to turn speech into tasks" : "Voice first, fields later"}</small>
        </span>
      </button>

      <button className="text-fallback-toggle" onClick={() => setShowTextInput((value) => !value)} title="Type fallback" type="button">
        {showTextInput ? <Plus size={18} /> : <Keyboard size={18} />}
      </button>

      {showTextInput ? (
        <div className="text-fallback">
          <input
            aria-label="Type a fallback task"
            autoFocus
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
              if (event.key === "Escape") setShowTextInput(false);
            }}
            placeholder="Type only when voice is inconvenient"
            value={draft}
          />
          <button onClick={submit} type="button">
            Add
          </button>
        </div>
      ) : null}
    </section>
  );
}
