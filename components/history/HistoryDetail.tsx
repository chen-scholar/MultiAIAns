"use client";

import * as React from "react";
import Link from "next/link";

import { AnswerGrid } from "@/components/chat/AnswerGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getHistory } from "@/lib/storage/history";
import type { AnswerCard, HistoryEntry } from "@/lib/types";

export function HistoryDetail({ id }: { id: string }) {
  const [entry, setEntry] = React.useState<HistoryEntry | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    setEntry(getHistory(id));
    setLoaded(true);
  }, [id]);

  if (!loaded) {
    return <p className="text-sm text-muted-foreground">加载中…</p>;
  }

  if (!entry) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">没找到这条历史记录。</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/history">返回 History</Link>
        </Button>
      </div>
    );
  }

  // 把存下来的回答还原成卡片，复用 Chat 的展示布局
  const cards: AnswerCard[] = entry.answers.map((a, i) => ({
    id: String(i),
    provider: a.provider,
    model: a.model,
    content: a.content,
    durationMs: a.durationMs ?? 0,
    status: a.status,
    error: a.error,
  }));

  const summary: AnswerCard | null = entry.summary
    ? {
        id: "summary",
        provider: entry.summary.provider,
        model: entry.summary.model,
        content: entry.summary.content,
        durationMs: entry.summary.durationMs ?? 0,
        status: "done",
      }
    : null;

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/history">← 返回</Link>
      </Button>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">问题</h2>
        <Card>
          <CardContent className="whitespace-pre-wrap pt-6 text-sm">
            {entry.question}
          </CardContent>
        </Card>
      </div>

      <AnswerGrid cards={cards} summary={summary} />
    </div>
  );
}
