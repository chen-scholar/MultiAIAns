"use client";

import { BrandIcon } from "@/components/chat/BrandIcon";
import { Markdown } from "@/components/markdown";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnswerCard } from "@/lib/types";

export function AnswerBox({ card }: { card: AnswerCard }) {
  const title = `${card.provider} / ${card.model}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BrandIcon name={title} />
          <CardTitle className="text-sm">{title}</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          {card.status === "streaming"
            ? "生成中…"
            : card.status === "error"
              ? "出错了"
              : `${card.durationMs} ms`}
        </p>
      </CardHeader>
      <CardContent>
        {card.status === "error" ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {card.error ?? "请求失败"}
          </p>
        ) : card.content ? (
          <Markdown>{card.content}</Markdown>
        ) : (
          <p className="text-sm text-muted-foreground">生成中…</p>
        )}
      </CardContent>
    </Card>
  );
}
