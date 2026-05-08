import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export type SenseVoiceSource = "huggingface" | "modelscope";

export type SenseVoiceStatus = {
  installed: boolean;
  totalBytes: number;
  path: string;
};

export type SenseVoiceProgress = {
  file: string;
  downloadedBytes: number;
  totalBytes: number;
  percent: number;
};

export function getSenseVoiceStatus() {
  return invoke<SenseVoiceStatus>("sensevoice_model_status");
}

export function downloadSenseVoiceModel(source: SenseVoiceSource) {
  return invoke<SenseVoiceStatus>("download_sensevoice_model", { request: { source } });
}

export function cancelSenseVoiceDownload() {
  return invoke<void>("cancel_sensevoice_model_download");
}

export function deleteSenseVoiceModel() {
  return invoke<SenseVoiceStatus>("delete_sensevoice_model");
}

export function onSenseVoiceProgress(callback: (progress: SenseVoiceProgress) => void) {
  return listen<SenseVoiceProgress>("sensevoice-download-progress", (event) => callback(event.payload));
}

export function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 MB";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
