export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  /** Parsed model list, derived from a comma-separated input. */
  models: string[];
}

export interface ChatResult {
  content: string;
  model: string;
  durationMs: number;
}
