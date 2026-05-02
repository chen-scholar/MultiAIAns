import { ChatForm } from "@/components/chat/ChatForm";
import { getDemoConfig, toPublicProviders } from "@/lib/demo/config";

export default function DemoPage() {
  const cfg = getDemoConfig();

  return (
    <div className="space-y-6">
      <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
        Demo（演示模式）下设置固定，若需灵活更改请自行部署在本地或云端！详见 GitHub 仓库说明中的部署指南。
      </p>
      <ChatForm demo={{ providers: toPublicProviders(cfg), summary: cfg.summary }} />
    </div>
  );
}
