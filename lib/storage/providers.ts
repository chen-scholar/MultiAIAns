"use client";

import type { Provider } from "@/lib/types";

const STORAGE_KEY = "multiaians.providers";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadProviders(): Provider[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Provider[];
  } catch {
    return [];
  }
}

export function saveProviders(providers: Provider[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
}

/** 把逗号分隔的 model 字符串拆成干净的数组 */
export function parseModels(input: string): string[] {
  return input
    .split(",")
    .map((m) => m.trim())
    .filter((m) => m.length > 0);
}

export function createId(): string {
  if (isBrowser() && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
