export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  /** 由逗号分隔的输入解析而来的 model 列表 */
  models: string[];
}

export interface ChatResult {
  content: string;
  model: string;
  durationMs: number;
}

// 多模型并排时，每个模型对应一张回答卡片的状态
export interface AnswerCard {
  id: string;
  provider: string;
  model: string;
  content: string;
  durationMs: number;
  status: "streaming" | "done" | "error";
  error?: string;
}

// 指向某个 Provider 下的某个 model，用于「总结用模型」配置
export interface SummaryModelRef {
  providerId: string;
  model: string;
}

export interface LogEntry {
  id: string;
  /** epoch ms */
  at: number;
  provider: string;
  model: string;
  /** 截断后的问题，绝不记录 apiKey */
  prompt: string;
  status: "success" | "error";
  durationMs?: number;
  /** 出错时是错误信息，成功时是回答的简短预览 */
  message?: string;
}
