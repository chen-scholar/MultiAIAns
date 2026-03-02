"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChatResult } from "@/lib/types";

export function AnswerBox({ result }: { result: ChatResult }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">回答</CardTitle>
        <p className="text-xs text-muted-foreground">
          {result.model} · {result.durationMs} ms
        </p>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {result.content || "（模型返回了空内容）"}
        </div>
      </CardContent>
    </Card>
  );
}
