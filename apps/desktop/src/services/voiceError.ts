export function formatVoiceError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("openrouter_api_key") || normalized.includes("is not configured")) {
    return "OpenRouter key missing";
  }

  if (normalized.includes("no speech detected")) {
    return "No speech detected";
  }

  if (normalized.includes("planner returned empty")
    || normalized.includes("planning failed after fallback attempts")
    || normalized.includes("\"tasks\"")
    || normalized.includes("too_small")) {
    return "Couldn't turn that into a task";
  }

  if (normalized.includes("transcription")
    || normalized.includes("audio/transcriptions")) {
    return "Transcription failed";
  }

  if (normalized.includes("openrouter")
    || normalized.includes("chat/completions")
    || normalized.includes("internal server error")) {
    return "AI planning failed";
  }

  if (normalized.includes("microphone")
    || normalized.includes("getusermedia")
    || normalized.includes("no mic")) {
    return "Microphone unavailable";
  }

  return "Voice capture failed";
}
