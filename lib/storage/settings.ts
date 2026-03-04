"use client";

import type { SummaryModelRef } from "@/lib/types";

// 带版本号，方便以后改结构
const SUMMARY_MODEL_KEY = "multiaians.summaryModel:v1";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadSummaryModel(): SummaryModelRef | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(SUMMARY_MODEL_KEY);
    return raw ? (JSON.parse(raw) as SummaryModelRef) : null;
  } catch {
    return null;
  }
}

export function saveSummaryModel(ref: SummaryModelRef): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(SUMMARY_MODEL_KEY, JSON.stringify(ref));
  } catch {
    // localStorage 不可用时忽略
  }
}

// Chat 里选好的模型组合（一串 optionKey），刷新后恢复
const CHAT_SELECTION_KEY = "multiaians.chatSelection:v1";

export function loadChatSelection(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CHAT_SELECTION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function saveChatSelection(keys: string[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(CHAT_SELECTION_KEY, JSON.stringify(keys));
  } catch {
    // localStorage 不可用时忽略
  }
}
