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
import { runChatStream, runDemoChatStream } from "@/lib/ai/stream-client";
import { flattenModelOptions } from "@/lib/models";
import { appendHistory, attachSummary } from "@/lib/storage/history";
import { createId, loadProviders } from "@/lib/storage/providers";
import {
  loadChatSelection,
  loadSummaryModel,
  saveChatSelection,
} from "@/lib/storage/settings";
import type {
  AnswerCard,
  HistoryAnswer,
  Provider,
  SummaryModelRef,
} from "@/lib/types";

// 一行模型选择
interface SelectionRow {
  rowId: string;
  optionKey: string;
}

// 对话框下方的示例问题，点一下直接向所有模型发问
const EXAMPLE_QUESTIONS = [
  "堆排序和桶排序的优缺点",
  "PyCharm和VSCode哪个更适合写Python",
  "安卓和iPhone的拍照哪个好",
];

const EXAMPLE_TOAST =
  "已同时向所有模型询问，向下翻动查看不同回答，回答完成后点击【总结】生成总结";

// Demo 模式：providers 与总结模型都来自仓库根的 demo.config.json（前端拿不到 Key）
interface DemoProps {
  providers: Provider[];
  summary?: SummaryModelRef;
}

export function ChatForm({ demo }: { demo?: DemoProps } = {}) {
  const isDemo = !!demo;

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

  // 轻量 Toast（点示例问题时提示一下），到点自动消失
  const [toast, setToast] = React.useState<string | null>(null);
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

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
    if (demo) {
      // Demo：模型固定为配置里的全部，全部预选，不读/不写 localStorage
      setProviders(demo.providers);
      const opts = flattenModelOptions(demo.providers);
      setRows(opts.map((o) => ({ rowId: createId(), optionKey: o.key })));
      return;
    }

    const loaded = loadProviders();
    setProviders(loaded);

    // 优先恢复上次选好的模型组合（过滤掉已失效的），否则默认第一个可用模型
    const opts = flattenModelOptions(loaded);
    const validKeys = new Set(opts.map((o) => o.key));
    const saved = loadChatSelection().filter((k) => validKeys.has(k));
    const keys = saved.length > 0 ? saved : opts[0] ? [opts[0].key] : [""];
    setRows(keys.map((k) => ({ rowId: createId(), optionKey: k })));
  }, [demo]);

  // 选择变化就存一份，刷新/重进后能恢复（demo 模式固定，不存）
  React.useEffect(() => {
    if (demo) return;
    if (rows.length === 0) return;
    saveChatSelection(rows.map((r) => r.optionKey));
  }, [rows, demo]);

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

    const handlers = {
      onDelta: (text: string) => {
        acc += text;
        setCards((prev) =>
          prev.map((c) =>
            c.id === job.id ? { ...c, content: c.content + text } : c
          )
        );
      },
      onDone: ({ model, durationMs }: { model: string; durationMs: number }) => {
        finalModel = model;
        finalDuration = durationMs;
        finalStatus = "done";
        setCards((prev) =>
          prev.map((c) =>
            c.id === job.id ? { ...c, status: "done", durationMs, model } : c
          )
        );
      },
      onError: (message: string) => {
        finalStatus = "error";
        finalError = message;
        setCards((prev) =>
          prev.map((c) =>
            c.id === job.id ? { ...c, status: "error", error: message } : c
          )
        );
      },
    };

    // 普通模式带 baseUrl + apiKey；demo 模式只带 providerId，Key 由服务端解析
    if (isDemo) {
      await runDemoChatStream(
        { providerId: job.provider.id, model: job.model, prompt: question },
        handlers
      );
    } else {
      await runChatStream(
        {
          baseUrl: job.provider.baseUrl,
          apiKey: job.provider.apiKey,
          model: job.model,
          prompt: question,
        },
        handlers
      );
    }

    return {
      provider: job.provider.name,
      model: finalModel,
      content: acc,
      durationMs: finalDuration,
      status: finalStatus,
      error: finalError,
    };
  }

  async function submit(overrideQuestion?: string) {
    setError(null);
    setCards([]);
    setSummaryCard(null);

    const question = (overrideQuestion ?? prompt).trim();
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

    // 整次问答存成一条历史（最新在最前），记下 id 以便之后把总结补进同一条。
    // Demo 模式临时演示，不写访客本地 History。
    if (!isDemo) {
      currentHistoryIdRef.current = appendHistory({ question, answers });
    }
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

  // 点示例问题：填入问题框并直接发送，同时弹个提示
  function askExample(question: string) {
    if (loading) return;
    setPrompt(question);
    showToast(EXAMPLE_TOAST);
    submit(question);
  }

  // 把所有「已完成」的回答拼成 prompt，交给总结用模型流式汇总
  async function handleSummarize() {
    const done = cards.filter((c) => c.status === "done" && c.content.trim());
    if (done.length === 0) return;

    const ref = isDemo ? demo?.summary ?? null : loadSummaryModel();
    const provider = ref
      ? providers.find((p) => p.id === ref.providerId)
      : undefined;
    if (!ref || !provider) {
      setError(
        isDemo
          ? "Demo 未配置总结用模型。"
          : "请先在 Settings 里配置「总结用模型」。"
      );
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

    const handlers = {
      onDelta: (text: string) => {
        acc += text;
        setSummaryCard((prev) =>
          prev ? { ...prev, content: prev.content + text } : prev
        );
      },
      onDone: ({ model, durationMs }: { model: string; durationMs: number }) => {
        sumModel = model;
        sumDuration = durationMs;
        sumStatus = "done";
        setSummaryCard((prev) =>
          prev ? { ...prev, status: "done", durationMs, model } : prev
        );
      },
      onError: (message: string) => {
        sumStatus = "error";
        setSummaryCard((prev) =>
          prev ? { ...prev, status: "error", error: message } : prev
        );
      },
    };

    if (isDemo) {
      await runDemoChatStream(
        { providerId: provider.id, model: ref.model, prompt: summaryPrompt },
        handlers
      );
    } else {
      await runChatStream(
        {
          baseUrl: provider.baseUrl,
          apiKey: provider.apiKey,
          model: ref.model,
          prompt: summaryPrompt,
        },
        handlers
      );
    }
    setSummarizing(false);

    // 总结成功就补进对应的那条历史记录（demo 不写 History）
    if (sumStatus === "done" && !isDemo) {
      attachSummary(currentHistoryIdRef.current, {
        provider: provider.name,
        model: sumModel,
        content: acc,
        durationMs: sumDuration,
      });
    }
  }

  if (providers.length === 0) {
    if (isDemo) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Demo 暂未配置模型</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            请在仓库根目录的 <code>demo.config.json</code> 里配置 Provider，并在环境变量里填好对应的 API Key。
          </CardContent>
        </Card>
      );
    }
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
              去 <b>设置</b> 添加你需要的模型提供商（填入 Base URL、API Key、模型编号）。
            </li>
            <li>
              在设置中的的 <b>总结设置</b> 里选一个「总结用模型」（用来汇总多个回答）。
            </li>
            <li>回到 <b>聊天</b> 选模型、提问。</li>
          </ol>
          <Button asChild>
            <Link href="/settings">去设置配置</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>
            {isDemo ? "模型（Demo 固定，不可更改）" : "模型（可加多个，一次并排作答）"}
          </Label>
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.rowId} className="flex items-center gap-2">
                <Select
                  value={row.optionKey}
                  onValueChange={(v) => changeRow(row.rowId, v)}
                  disabled={loading || isDemo}
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
                  disabled={loading || isDemo || rows.length <= 1}
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
            disabled={loading || isDemo}
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

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {EXAMPLE_QUESTIONS.map((q) => (
            <Button
              key={q}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => askExample(q)}
              disabled={loading}
              className="h-auto whitespace-normal py-2 text-left"
            >
              {q}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "回答中…" : "发送"}
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
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled
              title="等模型答完后可以一键总结所有回答"
            >
              总结所有回答
            </Button>
          )}
          <div className="flex-1 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            未来扩展功能放在这（联网搜索 / 思考强度 / 图片文件上传，持续开发中...）
          </div>
        </div>
      </form>

      {error ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <AnswerGrid cards={cards} summary={summaryCard} />

      {toast ? (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="max-w-md rounded-lg border bg-foreground px-4 py-3 text-sm text-background shadow-lg">
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  );
}
