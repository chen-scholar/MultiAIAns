"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clearLogs, loadLogs } from "@/lib/storage/logs";
import type { LogEntry } from "@/lib/types";

function formatTime(at: number) {
  return new Date(at).toLocaleString("zh-CN", { hour12: false });
}

export function LogView() {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);

  React.useEffect(() => {
    setLogs(loadLogs());
  }, []);

  function handleClear() {
    clearLogs();
    setLogs([]);
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        还没有日志。去 Chat 发一次问题，这里就会记录每个模型的请求结果。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleClear}>
          清空日志
        </Button>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm">
                  {log.provider} / {log.model}
                </CardTitle>
                <span
                  className={
                    log.status === "success"
                      ? "rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700"
                      : "rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive"
                  }
                >
                  {log.status === "success" ? "成功" : "失败"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatTime(log.at)}
                {log.durationMs !== undefined ? ` · ${log.durationMs} ms` : ""}
              </p>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">问题：</span>
                {log.prompt}
              </div>
              {log.message ? (
                <div
                  className={
                    log.status === "error"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }
                >
                  <span className="text-muted-foreground">
                    {log.status === "error" ? "错误：" : "预览："}
                  </span>
                  {log.message}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
