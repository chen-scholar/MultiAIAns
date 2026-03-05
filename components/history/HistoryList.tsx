"use client";

import * as React from "react";
import Link from "next/link";

import { BrandIcon } from "@/components/chat/BrandIcon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clearHistory, loadHistory } from "@/lib/storage/history";
import type { HistoryEntry } from "@/lib/types";

function formatTime(at: number) {
  return new Date(at).toLocaleString("zh-CN", { hour12: false });
}

function truncate(s: string, n = 60) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function HistoryList() {
  const [entries, setEntries] = React.useState<HistoryEntry[]>([]);

  React.useEffect(() => {
    setEntries(loadHistory());
  }, []);

  function handleClear() {
    clearHistory();
    setEntries([]);
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        还没有历史。去 Chat 提一个问题，这里就会记录完整的问答，点开能回看。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleClear}>
          清空历史
        </Button>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <Link key={entry.id} href={`/history/${entry.id}`} className="block">
            <Card className="transition-colors hover:bg-accent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {truncate(entry.question)}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {formatTime(entry.at)} · {entry.answers.length} 个模型
                  {entry.summary ? " · 含总结" : ""}
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {entry.answers.map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                  >
                    <BrandIcon name={`${a.provider} / ${a.model}`} className="h-4 w-4" />
                    {a.model}
                  </span>
                ))}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
