import OpenAI from "openai";

import type { ChatResult } from "@/lib/types";

interface CallParams {
  baseUrl: string;
  apiKey: string;
  model: string;
  prompt: string;
}

/**
 * Single, non-streaming call to any OpenAI-compatible chat completions API.
 * The model name is never hard-coded — it comes from the caller.
 */
export async function callOpenAICompatible({
  baseUrl,
  apiKey,
  model,
  prompt,
}: CallParams): Promise<ChatResult> {
  const client = new OpenAI({ baseURL: baseUrl, apiKey });

  const start = Date.now();
  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
  });
  const durationMs = Date.now() - start;

  const content = completion.choices[0]?.message?.content ?? "";

  return {
    content,
    model: completion.model || model,
    durationMs,
  };
}
