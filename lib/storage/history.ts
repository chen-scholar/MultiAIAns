"use client";

import { createId } from "@/lib/storage/providers";
import type { HistoryEntry, HistorySummary } from "@/lib/types";

// key 带版本号，方便以后改结构
const HISTORY_KEY = "multiaians.history:v1";
const MAX = 30;

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

// 完整会话比日志行大得多，写入时若超出 localStorage 配额，
// 就从最旧的（数组末尾）开始丢，直到能放下。
function persist(entries: HistoryEntry[]) {
  if (!isBrowser()) return;
  let list = entries.slice(0, MAX);
  while (list.length > 0) {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
      return;
    } catch {
      list = list.slice(0, -1);
    }
  }
}

// 追加一条历史，最新的排最前，返回它的 id（供之后补总结用）
export function appendHistory(entry: Omit<HistoryEntry, "id" | "at">): string {
  if (!isBrowser()) return "";
  const next: HistoryEntry = { ...entry, id: createId(), at: Date.now() };
  persist([next, ...loadHistory()]);
  return next.id;
}

// 给某条历史补上总结
export function attachSummary(id: string, summary: HistorySummary): void {
  if (!isBrowser()) return;
  persist(loadHistory().map((e) => (e.id === id ? { ...e, summary } : e)));
}

export function getHistory(id: string): HistoryEntry | null {
  return loadHistory().find((e) => e.id === id) ?? null;
}

export function clearHistory(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    // localStorage 不可用时忽略
  }
}
