"use client";

import * as React from "react";
import Link from "next/link";

import { AnswerGrid } from "@/components/chat/AnswerGrid";
import { BrandIcon } from "@/components/chat/BrandIcon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { flattenModelOptions } from "@/lib/models";
import { appendHistory, attachSummary } from "@/lib/storage/history";
import { createId, loadProviders } from "@/lib/storage/providers";
import {
  loadChatSelection,
  loadSummaryModel,
  saveChatSelection,
} from "@/lib/storage/settings";
import type { AnswerCard, HistoryAnswer, Provider } from "@/lib/types";

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

  // 最近一次提交的问题，用于「总结」时带上原问题（变化不需要触发重渲染，用 ref）
  const lastQuestionRef = React.useRef("");
  // 最近一次发送对应的历史记录 id，用于之后把总结补进同一条
  const currentHistoryIdRef = React.useRef("");
  const [summarizing, setSummarizing] = React.useState(false);
  const [summaryCard, setSummaryCard] = React.useState<AnswerCard | null>(null);

  // 把每个 Provider 的 models 拍平成「Provider / model」选项
  const options = React.useMemo(
    () => flattenModelOptions(providers),
    [providers]
  );

  const optionByKey = React.useMemo(
    () => new Map(options.map((o) => [o.key, o])),
    [options]
  );

  React.useEffect(() => {
    const loaded = loadProviders();
    setProviders(loaded);

    // 优先恢复上次选好的模型组合（过滤掉已失效的），否则默认第一个可用模型
    const opts = flattenModelOptions(loaded);
    const validKeys = new Set(opts.map((o) => o.key));
    const saved = loadChatSelection().filter((k) => validKeys.has(k));
    const keys = saved.length > 0 ? saved : opts[0] ? [opts[0].key] : [""];
    setRows(keys.map((k) => ({ rowId: createId(), optionKey: k })));
  }, []);

  // 选择变化就存一份，刷新/重进后能恢复
  React.useEffect(() => {
    if (rows.length === 0) return;
    saveChatSelection(rows.map((r) => r.optionKey));
  }, [rows]);

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

  // 单张卡片的流式任务：边收边更新对应卡片，结束后返回这条回答的最终结果（用于存历史）
  async function runCard(
    job: { id: string; provider: Provider; model: string },
    question: string
  ): Promise<HistoryAnswer> {
    let acc = "";
    let finalModel = job.model;
    let finalDuration: number | undefined;
    let finalStatus: "done" | "error" = "done";
    let finalError: string | undefined;

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
          finalModel = model;
          finalDuration = durationMs;
          finalStatus = "done";
          setCards((prev) =>
            prev.map((c) =>
              c.id === job.id ? { ...c, status: "done", durationMs, model } : c
            )
          );
        },
        onError: (message) => {
          finalStatus = "error";
          finalError = message;
          setCards((prev) =>
            prev.map((c) =>
              c.id === job.id ? { ...c, status: "error", error: message } : c
            )
          );
        },
      }
    );

    return {
      provider: job.provider.name,
      model: finalModel,
      content: acc,
      durationMs: finalDuration,
      status: finalStatus,
      error: finalError,
    };
  }

  async function submit() {
    setError(null);
    setCards([]);
    setSummaryCard(null);

    const question = prompt.trim();
    if (!question) {
      setError("请输入问题。");
      return;
    }
    lastQuestionRef.current = question;

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
    const answers = await Promise.all(jobs.map((j) => runCard(j, question)));
    setLoading(false);

    // 整次问答存成一条历史（最新在最前），记下 id 以便之后把总结补进同一条
    currentHistoryIdRef.current = appendHistory({ question, answers });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter 发送、Shift+Enter 换行；输入法组词时的回车不触发
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!loading) submit();
    }
  }

  // 把所有「已完成」的回答拼成 prompt，交给总结用模型流式汇总
  async function handleSummarize() {
    const done = cards.filter((c) => c.status === "done" && c.content.trim());
    if (done.length === 0) return;

    const ref = loadSummaryModel();
    const provider = ref
      ? providers.find((p) => p.id === ref.providerId)
      : undefined;
    if (!ref || !provider) {
      setError("请先在 Settings 里配置「总结用模型」。");
      return;
    }
    setError(null);

    const blocks = done
      .map((c, i) => `【回答 ${i + 1}｜${c.provider} / ${c.model}】\n${c.content}`)
      .join("\n\n");
    const summaryPrompt =
      "下面是多个 AI 模型对同一个问题的回答。请综合所有回答，输出一个更完整、更准确、去重后的总结版本，" +
      "并简要指出它们的共识与主要分歧，用 Markdown 组织。\n\n" +
      `【原问题】\n${lastQuestionRef.current}\n\n${blocks}`;

    setSummaryCard({
      id: createId(),
      provider: provider.name,
      model: ref.model,
      content: "",
      durationMs: 0,
      status: "streaming",
    });
    setSummarizing(true);

    let acc = "";
    let sumModel = ref.model;
    let sumDuration: number | undefined;
    let sumStatus: "done" | "error" = "done";

    await runChatStream(
      {
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
        model: ref.model,
        prompt: summaryPrompt,
      },
      {
        onDelta: (text) => {
          acc += text;
          setSummaryCard((prev) =>
            prev ? { ...prev, content: prev.content + text } : prev
          );
        },
        onDone: ({ model, durationMs }) => {
          sumModel = model;
          sumDuration = durationMs;
          sumStatus = "done";
          setSummaryCard((prev) =>
            prev ? { ...prev, status: "done", durationMs, model } : prev
          );
        },
        onError: (message) => {
          sumStatus = "error";
          setSummaryCard((prev) =>
            prev ? { ...prev, status: "error", error: message } : prev
          );
        },
      }
    );
    setSummarizing(false);

    // 总结成功就补进对应的那条历史记录
    if (sumStatus === "done") {
      attachSummary(currentHistoryIdRef.current, {
        provider: provider.name,
        model: sumModel,
        content: acc,
        durationMs: sumDuration,
      });
    }
  }

  if (providers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>欢迎使用 MultiAIAns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            还没有任何配置，先花一分钟做下面几步：
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              去 <b>Settings</b> 添加一个 Provider（填 Base URL、API Key、模型）。
            </li>
            <li>
              在 Settings 的 <b>总结设置</b> 里选一个「总结用模型」（可选，用来汇总多个回答）。
            </li>
            <li>回到 Chat 选模型、提问。</li>
          </ol>
          <Button asChild>
            <Link href="/settings">去 Settings 配置</Link>
          </Button>
        </CardContent>
      </Card>
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
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题…（Enter 发送，Shift+Enter 换行）"
            rows={5}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "发送中…" : "发送"}
          </Button>
          {!loading && cards.some((c) => c.status === "done") ? (
            <Button
              type="button"
              variant="secondary"
              onClick={handleSummarize}
              disabled={summarizing}
            >
              {summarizing ? "总结中…" : "总结所有回答"}
            </Button>
          ) : null}
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

      <AnswerGrid cards={cards} summary={summaryCard} />
    </div>
  );
}
