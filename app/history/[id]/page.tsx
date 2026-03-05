import { HistoryDetail } from "@/components/history/HistoryDetail";

export default function HistoryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">History</h1>
      <HistoryDetail id={params.id} />
    </div>
  );
}
