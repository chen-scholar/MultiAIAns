import { cn } from "@/lib/utils";

interface Brand {
  key: string;
  label: string;
  /** 命中这些关键词就归为该品牌（对 "Provider / model" 文本做小写包含匹配） */
  keywords: string[];
  /** 官方品牌色（近似），作徽标底色 */
  color: string;
  /** 角标字母 */
  short: string;
}

// 先适配这几家；以后要加品牌就往数组里加一条。
// 注：这里是「品牌色 + 字母角标」的轻量徽标，后续可替换成官方 SVG。
const BRANDS: Brand[] = [
  { key: "deepseek", label: "DeepSeek", keywords: ["deepseek"], color: "#4D6BFE", short: "DS" },
  { key: "openai", label: "OpenAI", keywords: ["gpt", "openai", "o1", "o3", "o4"], color: "#10A37F", short: "AI" },
  { key: "gemini", label: "Gemini", keywords: ["gemini", "google"], color: "#1C69FF", short: "Gm" },
  { key: "claude", label: "Claude", keywords: ["claude", "anthropic"], color: "#D97757", short: "Cl" },
  { key: "glm", label: "GLM", keywords: ["glm", "zhipu", "chatglm"], color: "#2E5BFF", short: "GL" },
  { key: "qwen", label: "Qwen", keywords: ["qwen", "tongyi", "通义"], color: "#615CED", short: "Qw" },
  { key: "minimax", label: "MiniMax", keywords: ["minimax"], color: "#FF6B6B", short: "MM" },
  { key: "grok", label: "Grok", keywords: ["grok", "xai"], color: "#111827", short: "Gk" },
];

export function getBrand(text: string): Brand | null {
  const t = text.toLowerCase();
  return BRANDS.find((b) => b.keywords.some((k) => t.includes(k))) ?? null;
}

// 根据 "Provider / model" 文本猜测品牌，渲染一个小徽标；没匹配上就用中性灰 + 首字母兜底。
export function BrandIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const brand = getBrand(name);
  const color = brand?.color ?? "#6B7280";
  const short = brand?.short ?? name.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold text-white",
        className
      )}
      style={{ backgroundColor: color }}
      title={brand?.label ?? name}
      aria-hidden
    >
      {short}
    </span>
  );
}
