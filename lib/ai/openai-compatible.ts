import OpenAI from "openai";

interface CallParams {
  baseUrl: string;
  apiKey: string;
  model: string;
  prompt: string;
}

// 向任意 OpenAI-compatible 接口发起一次「流式」对话请求。
// model 名称由调用方传入，不写死。返回 OpenAI SDK 的 streaming 迭代器，
// 由调用方逐块消费。
export async function streamOpenAICompatible({
  baseUrl,
  apiKey,
  model,
  prompt,
}: CallParams) {
  const client = new OpenAI({ baseURL: baseUrl, apiKey });

  return client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });
}
