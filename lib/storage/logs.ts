"use client";

import { createId } from "@/lib/storage/providers";
import type { LogEntry } from "@/lib/types";

// key 带版本号，方便以后改结构时平滑迁移
const LOGS_KEY = "multiaians.logs:v1";
const MAX_LOGS = 50;

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadLogs(): LogEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LogEntry[]) : [];
  } catch {
    return [];
  }
}

// 追加一条日志，最新的排在最前，最多保留 MAX_LOGS 条
export function appendLog(entry: Omit<LogEntry, "id" | "at">): void {
  if (!isBrowser()) return;
  const next: LogEntry = { ...entry, id: createId(), at: Date.now() };
  const updated = [next, ...loadLogs()].slice(0, MAX_LOGS);
  try {
    window.localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
  } catch {
    // localStorage 在隐私模式 / 配额满 / 被禁用时会抛错，直接忽略
  }
}

export function clearLogs(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(LOGS_KEY);
  } catch {
    // 同上
  }
}
