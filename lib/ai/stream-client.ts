"use client";

interface StreamArgs {
  baseUrl: string;
  apiKey: string;
  model: string;
  prompt: string;
}

interface DemoStreamArgs {
  providerId: string;
  model: string;
  prompt: string;
}

interface StreamHandlers {
  onDelta: (text: string) => void;
  onDone: (info: { model: string; durationMs: number }) => void;
  onError: (message: string) => void;
}

// 向 /api/multi-chat POST 一次请求，逐行解析 NDJSON 并回调。
// 普通模式和 demo 模式只是请求体不同，读流逻辑完全一样。
async function readNdjson(
  body: unknown,
  { onDelta, onDone, onError }: StreamHandlers
): Promise<void> {
  try {
    const res = await fetch("/api/multi-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // 校验失败等情况后端返回 JSON 错误（非流式）
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => null);
      onError(data?.error ?? "请求失败");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // 末尾可能是半行，留到下次拼接

      for (const line of lines) {
        if (!line.trim()) continue;
        const evt = JSON.parse(line);
        if (evt.type === "delta") {
          onDelta(evt.content);
        } else if (evt.type === "done") {
          onDone({ model: evt.model, durationMs: evt.durationMs });
        } else if (evt.type === "error") {
          onError(evt.message);
        }
      }
    }
  } catch (err) {
    onError(err instanceof Error ? err.message : "网络请求失败");
  }
}

// 普通模式：前端带上 baseUrl + apiKey。
// 多模型并排时，每张卡片各调用一次本函数，互不影响。
export function runChatStream(
  { baseUrl, apiKey, model, prompt }: StreamArgs,
  handlers: StreamHandlers
): Promise<void> {
  return readNdjson({ baseUrl, apiKey, model, prompt }, handlers);
}

// Demo 模式：只带 providerId，Key 由服务端解析，前端拿不到。
export function runDemoChatStream(
  { providerId, model, prompt }: DemoStreamArgs,
  handlers: StreamHandlers
): Promise<void> {
  return readNdjson({ demo: true, providerId, model, prompt }, handlers);
}
