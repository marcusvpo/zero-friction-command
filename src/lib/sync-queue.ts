import { pushWorkoutLog, type WorkoutLogRow } from "./db";

/**
 * sync-queue — write-through offline queue para workout logs.
 *
 * Confirmar set escreve aqui instantaneamente (localStorage). Em background,
 * tenta drenar pra Supabase quando online. Sem Service Worker — funciona
 * enquanto a aba estiver aberta (cobre o caso de academia com sinal fraco).
 */

const KEY = "marcola-sync-queue-v1";
const MAX_QUEUE = 500;
const MAX_ATTEMPTS = 5;
const FLUSH_INTERVAL_MS = 30_000;

export interface QueueItem {
  id: string;
  type: "workout_log";
  payload: WorkoutLogRow;
  attempts: number;
  ts: number;
}

type Listener = (count: number) => void;

let queue: QueueItem[] = [];
const listeners = new Set<Listener>();
let initialized = false;
let flushing = false;
let timer: number | null = null;

function load() {
  if (typeof window === "undefined") return;
  try {
    queue = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
  } catch {
    queue = [];
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(queue));
  } catch {
    /* quota — ignore */
  }
  listeners.forEach((l) => l(queue.length));
}

export function initSyncQueue() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  load();
  window.addEventListener("online", () => { void flush(); });
  timer = window.setInterval(() => {
    if (queue.length) void flush();
  }, FLUSH_INTERVAL_MS);
  // Notify subscribers about initial load count.
  listeners.forEach((l) => l(queue.length));
  if (typeof navigator !== "undefined" && navigator.onLine) {
    void flush();
  }
}

export function teardownSyncQueue() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  initialized = false;
}

export function subscribeQueue(fn: Listener): () => void {
  listeners.add(fn);
  fn(queue.length);
  return () => { listeners.delete(fn); };
}

export function getQueueLength(): number {
  return queue.length;
}

export function enqueueWorkoutLog(payload: WorkoutLogRow) {
  if (typeof window === "undefined") return;
  const item: QueueItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "workout_log",
    payload,
    attempts: 0,
    ts: Date.now(),
  };
  queue.push(item);
  // FIFO cap — protege contra storage growth se usuário ficar muitos dias offline.
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
  persist();
  if (typeof navigator !== "undefined" && navigator.onLine) {
    void flush();
  }
}

export async function flush(): Promise<void> {
  if (flushing || queue.length === 0) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  flushing = true;
  try {
    // Snapshot to avoid mutating while iterating.
    const pending = [...queue];
    for (const item of pending) {
      const ok = await pushWorkoutLog(item.payload);
      if (ok) {
        queue = queue.filter((q) => q.id !== item.id);
        persist();
      } else {
        item.attempts += 1;
        if (item.attempts >= MAX_ATTEMPTS) {
          queue = queue.filter((q) => q.id !== item.id);
          persist();
        } else {
          persist();
          break; // backoff — retry no próximo tick
        }
      }
    }
  } finally {
    flushing = false;
  }
}
