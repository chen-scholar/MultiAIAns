import { NextResponse } from "next/server";

import { streamOpenAICompatible } from "@/lib/ai/openai-compatible";
import { chatRequestSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法的 JSON" }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { baseUrl, apiKey, model, prompt } = parsed.data;
  const encoder = new TextEncoder();

  // 用 NDJSON（每行一个 JSON）逐块往外推流：
  //   { type: "delta", content }      —— 模型吐出的一小段文本
  //   { type: "done",  model, durationMs } —— 结束，附带最终模型名与耗时
  //   { type: "error", message }      —— 调用过程中出错
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      const startedAt = Date.now();
      let resolvedModel = model;

      try {
        const completion = await streamOpenAICompatible({
          baseUrl,
          apiKey,
          model,
          prompt,
        });

        for await (const chunk of completion) {
          if (chunk.model) resolvedModel = chunk.model;
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) send({ type: "delta", content: delta });
        }

        send({
          type: "done",
          model: resolvedModel,
          durationMs: Date.now() - startedAt,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "调用模型时发生未知错误";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
