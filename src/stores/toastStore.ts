import { useSyncExternalStore } from "react";

type ToastType = "error" | "success" | "warning";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastStoreState = {
  toasts: Toast[];
};

const initialState: ToastStoreState = { toasts: [] };
let state = initialState;
const listeners = new Set<() => void>();

function emit(next: ToastStoreState) {
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

export function useToastStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

let toastIdCounter = 0;

export function showToast(message: string, type: ToastType = "success") {
  const id = `${++toastIdCounter}`;
  const next = { ...state, toasts: [...state.toasts, { id, message, type }] };
  emit(next);

  setTimeout(() => {
    dismissToast(id);
  }, 3000);
}

export function dismissToast(id: string) {
  const next = { ...state, toasts: state.toasts.filter((t) => t.id !== id) };
  emit(next);
}
