import demoConfig from "@/demo.config.json";
import type { Provider, SummaryModelRef } from "@/lib/types";

// Demo 模式下的 Provider：apiKey 不写在文件里，只写环境变量名 apiKeyEnv（如 MAA_APIKEY_01）
export interface DemoProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyEnv: string;
  models: string[];
}

export interface DemoConfig {
  providers: DemoProvider[];
  summary?: SummaryModelRef;
}

// 直接返回打包进产物的配置（无 Key，仅环境变量名，安全）
export function getDemoConfig(): DemoConfig {
  return demoConfig as DemoConfig;
}

// 给前端用的 Provider 形状：抹掉 apiKeyEnv，apiKey 置空（demo 下前端不需要、也不该拿到 Key）
export function toPublicProviders(cfg: DemoConfig): Provider[] {
  return cfg.providers.map((p) => ({
    id: p.id,
    name: p.name,
    baseUrl: p.baseUrl,
    apiKey: "",
    models: p.models,
  }));
}

// 仅服务端调用：按 id 找到 demo provider，从环境变量解析真实 Key
export function resolveDemoCredential(
  providerId: string
): { baseUrl: string; apiKey: string } | { error: string } {
  const provider = getDemoConfig().providers.find((p) => p.id === providerId);
  if (!provider) {
    return { error: `Demo 配置里找不到 provider：${providerId}` };
  }
  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) {
    return { error: `Demo 模式未配置环境变量 ${provider.apiKeyEnv}` };
  }
  return { baseUrl: provider.baseUrl, apiKey };
}
