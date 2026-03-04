import type { Provider } from "@/lib/types";

// 跨所有 Provider 拍平出的「Provider / model」可选项
export interface ModelOption {
  key: string;
  providerId: string;
  providerName: string;
  model: string;
  label: string;
}

// 把每个 Provider 的 models 拍平成「Provider / model」选项，
// Chat 的多模型选择器和 Settings 的总结模型选择器共用。
export function flattenModelOptions(providers: Provider[]): ModelOption[] {
  return providers.flatMap((p) =>
    p.models.map((m) => ({
      key: `${p.id}__${m}`,
      providerId: p.id,
      providerName: p.name,
      model: m,
      label: `${p.name} / ${m}`,
    }))
  );
}
