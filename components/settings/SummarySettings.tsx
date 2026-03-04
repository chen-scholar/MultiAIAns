"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandIcon } from "@/components/chat/BrandIcon";
import { flattenModelOptions } from "@/lib/models";
import { loadSummaryModel, saveSummaryModel } from "@/lib/storage/settings";
import type { Provider } from "@/lib/types";

export function SummarySettings({ providers }: { providers: Provider[] }) {
  const options = React.useMemo(
    () => flattenModelOptions(providers),
    [providers]
  );
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    const ref = loadSummaryModel();
    if (ref) setValue(`${ref.providerId}__${ref.model}`);
  }, []);

  function handleChange(key: string) {
    setValue(key);
    const opt = options.find((o) => o.key === key);
    if (opt) saveSummaryModel({ providerId: opt.providerId, model: opt.model });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>总结设置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label>总结用模型</Label>
        <Select
          value={value}
          onValueChange={handleChange}
          disabled={options.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择一个用于总结的 Provider / model" />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.key} value={o.key}>
                <span className="flex items-center gap-2">
                  <BrandIcon name={o.label} className="h-5 w-5" />
                  {o.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          在 Chat 点「总结所有回答」时，会用这个模型把多个回答汇总成一份。
        </p>
      </CardContent>
    </Card>
  );
}
