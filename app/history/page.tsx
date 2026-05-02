import { HistoryList } from "@/components/history/HistoryList";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">历史 / History</h1>
        <p className="text-sm text-muted-foreground">
          每次问答都完整记在本地浏览器，点开可回看当时的回答与总结（不含 apiKey）。
        </p>
      </div>
      <HistoryList />
    </div>
  );
}
