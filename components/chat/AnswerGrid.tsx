import { AnswerBox } from "@/components/chat/AnswerBox";
import type { AnswerCard } from "@/lib/types";

// 回答展示区：总结卡在上、各模型回答并排在下。
// Chat 的实时结果和 History 详情页复用同一套布局，保证「和当时一样」。
export function AnswerGrid({
  cards,
  summary,
}: {
  cards: AnswerCard[];
  summary?: AnswerCard | null;
}) {
  if (cards.length === 0 && !summary) return null;

  return (
    <div className="space-y-6">
      {summary ? (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">总结</h2>
          <AnswerBox card={summary} />
        </div>
      ) : null}

      {cards.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <AnswerBox key={card.id} card={card} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
