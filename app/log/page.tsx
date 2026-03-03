import { LogView } from "@/components/log/LogView";

export default function LogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Log</h1>
        <p className="text-sm text-muted-foreground">
          每次发送的请求结果都记在本地浏览器，方便快速定位问题（不含 apiKey）。
        </p>
      </div>
      <LogView />
    </div>
  );
}
