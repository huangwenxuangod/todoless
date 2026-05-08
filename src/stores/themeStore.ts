import { useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark" | "system";

type ThemeStoreState = {
  mode: ThemeMode;
};

function getStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem("todoless-theme") as ThemeMode | null;
    if (stored && ["light", "dark", "system"].includes(stored)) return stored;
  } catch {
    /* ignore */
  }
  return "system";
}

let state: ThemeStoreState = { mode: getStoredMode() };
const listeners = new Set<() => void>();

function emit(next: ThemeStoreState) {
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useThemeStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setThemeMode(mode: ThemeMode) {
  try {
    localStorage.setItem("todoless-theme", mode);
  } catch {
    /* ignore */
  }
  emit({ mode });
  applyTheme(mode);
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);

  if (isDark) {
    root.classList.remove("light");
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
  }
}

export type { ThemeMode };

export function initTheme() {
  applyTheme(state.mode);
}
