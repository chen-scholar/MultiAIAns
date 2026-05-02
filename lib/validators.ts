import { z } from "zod";

// 普通模式：前端把 baseUrl + apiKey 一起带上来
export const userChatSchema = z.object({
  baseUrl: z.string().trim().url("baseUrl 必须是合法的 URL"),
  apiKey: z.string().trim().min(1, "apiKey 不能为空"),
  model: z.string().trim().min(1, "model 不能为空"),
  prompt: z.string().trim().min(1, "prompt 不能为空"),
});

// Demo 模式：前端只带 providerId，由服务端按 demo 配置 + 环境变量解析 Key
export const demoChatSchema = z.object({
  demo: z.literal(true),
  providerId: z.string().trim().min(1, "providerId 不能为空"),
  model: z.string().trim().min(1, "model 不能为空"),
  prompt: z.string().trim().min(1, "prompt 不能为空"),
});

export const chatRequestSchema = z.union([demoChatSchema, userChatSchema]);

export type ChatRequest = z.infer<typeof chatRequestSchema>;
