"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Provider } from "@/lib/types";

interface ProviderListProps {
  providers: Provider[];
  onEdit: (provider: Provider) => void;
  onDelete: (id: string) => void;
}

export function ProviderList({ providers, onEdit, onDelete }: ProviderListProps) {
  if (providers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        还没有 Provider，先在下面添加一个。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <Card key={provider.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{provider.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="text-muted-foreground break-all">
              {provider.baseUrl}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {provider.models.map((model) => (
                <span
                  key={model}
                  className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                >
                  {model}
                </span>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(provider)}
              >
                编辑
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(provider.id)}
              >
                删除
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
