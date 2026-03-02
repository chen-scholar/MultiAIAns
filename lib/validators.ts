import { z } from "zod";

export const chatRequestSchema = z.object({
  baseUrl: z.string().trim().url("baseUrl 必须是合法的 URL"),
  apiKey: z.string().trim().min(1, "apiKey 不能为空"),
  model: z.string().trim().min(1, "model 不能为空"),
  prompt: z.string().trim().min(1, "prompt 不能为空"),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
