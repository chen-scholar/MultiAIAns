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

// 一条历史记录里的单个模型回答
export interface HistoryAnswer {
  provider: string;
  model: string;
  content: string;
  durationMs?: number;
  status: "done" | "error";
  error?: string;
}

// 历史记录里的总结（可选，用户点了「总结所有回答」才有）
export interface HistorySummary {
  provider: string;
  model: string;
  content: string;
  durationMs?: number;
}

// 一次「发送」存成一条完整会话记录：问题 + 各模型回答 + 可选总结。绝不记录 apiKey。
export interface HistoryEntry {
  id: string;
  /** epoch ms */
  at: number;
  question: string;
  answers: HistoryAnswer[];
  summary?: HistorySummary;
}
