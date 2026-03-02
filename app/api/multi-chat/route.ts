import { NextResponse } from "next/server";

import { callOpenAICompatible } from "@/lib/ai/openai-compatible";
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

  try {
    const result = await callOpenAICompatible(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "调用模型时发生未知错误";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
