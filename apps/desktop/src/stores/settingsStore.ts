import { getAllWindows } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { useSyncExternalStore } from "react";

export type AsrModel = "openai/whisper-large-v3-turbo" | "openai/whisper-1" | "local/sensevoice-small";
export type TextModel = "deepseek/deepseek-v4-flash" | "local/default";
export type CloseBehavior = "hideToTray" | "quit";

export type AppSettings = {
  mainAlwaysOnTop: boolean;
  widgetAlwaysOnTop: boolean;
  shortcut: string;
  defaultDueTime: string;
  closeBehavior: CloseBehavior;
  asrModel: AsrModel;
  textModel: TextModel;
};

const storageKey = "todoless-settings";

const defaultSettings: AppSettings = {
  mainAlwaysOnTop: false,
  widgetAlwaysOnTop: true,
  shortcut: "Ctrl+Shift+Space",
  defaultDueTime: "22:00",
  closeBehavior: "hideToTray",
  asrModel: "openai/whisper-large-v3-turbo",
  textModel: "deepseek/deepseek-v4-flash",
};

let settings = loadSettings();
const listeners = new Set<() => void>();

export function getAppSettings() {
  return settings;
}

export function subscribeSettings(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSettingsSnapshot() {
  return settings;
}

export function useAppSettings() {
  return useSyncExternalStore(subscribeSettings, getSettingsSnapshot, getSettingsSnapshot);
}

export async function initAppSettings() {
  await applyAlwaysOnTop();
  await invoke("set_global_shortcut", { shortcut: settings.shortcut });
}

export async function setMainAlwaysOnTop(mainAlwaysOnTop: boolean) {
  updateSettings({ mainAlwaysOnTop });
  await applyAlwaysOnTop();
}

export async function setWidgetAlwaysOnTop(widgetAlwaysOnTop: boolean) {
  updateSettings({ widgetAlwaysOnTop });
  await applyAlwaysOnTop();
}

export async function setShortcut(shortcut: string) {
  updateSettings({ shortcut });
  await invoke("set_global_shortcut", { shortcut });
}

export function setDefaultDueTime(defaultDueTime: string) {
  updateSettings({ defaultDueTime });
}

export function setCloseBehavior(closeBehavior: CloseBehavior) {
  updateSettings({ closeBehavior });
}

export function setAsrModel(asrModel: AsrModel) {
  updateSettings({ asrModel });
}

export function setTextModel(textModel: TextModel) {
  updateSettings({ textModel });
}

async function applyAlwaysOnTop() {
  const windows = await getAllWindows();
  await Promise.all(
    windows.map((window) => {
      const alwaysOnTop = window.label === "widget" ? settings.widgetAlwaysOnTop : settings.mainAlwaysOnTop;
      return window.setAlwaysOnTop(alwaysOnTop);
    }),
  );
}

function updateSettings(patch: Partial<AppSettings>) {
  settings = { ...settings, ...patch };
  localStorage.setItem(storageKey, JSON.stringify(settings));
  listeners.forEach((listener) => listener());
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}
