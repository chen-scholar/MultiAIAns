"use client";

import * as React from "react";
import Link from "next/link";

import { AnswerBox } from "@/components/chat/AnswerBox";
import { BrandIcon } from "@/components/chat/BrandIcon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { runChatStream } from "@/lib/ai/stream-client";
import { appendLog } from "@/lib/storage/logs";
import { createId, loadProviders } from "@/lib/storage/providers";
import type { AnswerCard, Provider } from "@/lib/types";

// 把问题/回答截断一下，避免日志存太大
function truncate(s: string, n = 200) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// 跨所有 Provider 拍平出的「Provider / model」可选项
interface ModelOption {
  key: string;
  providerId: string;
  providerName: string;
  model: string;
  label: string;
}

// 一行模型选择
interface SelectionRow {
  rowId: string;
  optionKey: string;
}

export function ChatForm() {
  const [providers, setProviders] = React.useState<Provider[]>([]);
  const [rows, setRows] = React.useState<SelectionRow[]>([]);
  const [prompt, setPrompt] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cards, setCards] = React.useState<AnswerCard[]>([]);

  // 把每个 Provider 的 models 拍平成「Provider / model」选项
  const options = React.useMemo<ModelOption[]>(() => {
    return providers.flatMap((p) =>
      p.models.map((m) => ({
        key: `${p.id}__${m}`,
        providerId: p.id,
        providerName: p.name,
        model: m,
        label: `${p.name} / ${m}`,
      }))
    );
  }, [providers]);

  const optionByKey = React.useMemo(() => {
    const map = new Map<string, ModelOption>();
    for (const o of options) map.set(o.key, o);
    return map;
  }, [options]);

  React.useEffect(() => {
    const loaded = loadProviders();
    setProviders(loaded);
    // 默认放一行，选中第一个可用模型
    const firstKey = loaded[0]?.models[0]
      ? `${loaded[0].id}__${loaded[0].models[0]}`
      : "";
    setRows([{ rowId: createId(), optionKey: firstKey }]);
  }, []);

  function addRow() {
    setRows((prev) => [
      ...prev,
      { rowId: createId(), optionKey: options[0]?.key ?? "" },
    ]);
  }

  function removeRow(rowId: string) {
    setRows((prev) =>
      prev.length <= 1 ? prev : prev.filter((r) => r.rowId !== rowId)
    );
  }

  function changeRow(rowId: string, optionKey: string) {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, optionKey } : r))
    );
  }

  // 单张卡片的流式任务：边收边更新对应卡片，结束/出错各写一条日志
  async function runCard(
    job: { id: string; provider: Provider; model: string },
    question: string
  ) {
    let acc = "";
    await runChatStream(
      {
        baseUrl: job.provider.baseUrl,
        apiKey: job.provider.apiKey,
        model: job.model,
        prompt: question,
      },
      {
        onDelta: (text) => {
          acc += text;
          setCards((prev) =>
            prev.map((c) =>
              c.id === job.id ? { ...c, content: c.content + text } : c
            )
          );
        },
        onDone: ({ model, durationMs }) => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === job.id ? { ...c, status: "done", durationMs, model } : c
            )
          );
          appendLog({
            provider: job.provider.name,
            model,
            prompt: truncate(question),
            status: "success",
            durationMs,
            message: truncate(acc, 80),
          });
        },
        onError: (message) => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === job.id ? { ...c, status: "error", error: message } : c
            )
          );
          appendLog({
            provider: job.provider.name,
            model: job.model,
            prompt: truncate(question),
            status: "error",
            message,
          });
        },
      }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCards([]);

    const question = prompt.trim();
    if (!question) {
      setError("请输入问题。");
      return;
    }

    // 把每行选择解析成可执行任务
    const jobs = rows
      .map((r) => {
        const opt = optionByKey.get(r.optionKey);
        const provider = opt
          ? providers.find((p) => p.id === opt.providerId)
          : undefined;
        if (!opt || !provider) return null;
        return { id: r.rowId, provider, model: opt.model };
      })
      .filter((j): j is { id: string; provider: Provider; model: string } => j !== null);

    if (jobs.length === 0) {
      setError("请先选择至少一个模型。");
      return;
    }

    // 先把卡片铺出来（生成中状态）
    setCards(
      jobs.map((j) => ({
        id: j.id,
        provider: j.provider.name,
        model: j.model,
        content: "",
        durationMs: 0,
        status: "streaming" as const,
      }))
    );

    setLoading(true);
    // 所有模型并发跑，互不阻塞
    await Promise.all(jobs.map((j) => runCard(j, question)));
    setLoading(false);
  }

  if (providers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        还没有配置 Provider，请先去{" "}
        <Link href="/settings" className="underline">
          Settings
        </Link>{" "}
        添加。
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>模型（可加多个，一次并排作答）</Label>
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.rowId} className="flex items-center gap-2">
                <Select
                  value={row.optionKey}
                  onValueChange={(v) => changeRow(row.rowId, v)}
                  disabled={loading}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="选择 Provider / model" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((o) => (
                      <SelectItem key={o.key} value={o.key}>
                        <span className="flex items-center gap-2">
                          <BrandIcon name={o.label} className="h-5 w-5" />
                          {o.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeRow(row.rowId)}
                  disabled={loading || rows.length <= 1}
                  aria-label="删除这一行"
                >
                  −
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            disabled={loading}
          >
            + 添加模型
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt">问题</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="输入你的问题…"
            rows={5}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "发送中…" : "发送"}
          </Button>
          <div className="flex-1 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            未来扩展功能放在这（联网搜索 / 思考强度 / 图片文件上传，开发中）
          </div>
        </div>
      </form>

      {error ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {cards.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <AnswerBox key={card.id} card={card} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
