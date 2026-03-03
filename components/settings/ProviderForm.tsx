"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parseModels } from "@/lib/storage/providers";
import type { Provider } from "@/lib/types";

interface ProviderFormProps {
  /** 有值时表示在编辑这个 Provider，否则是新建 */
  editing: Provider | null;
  onSubmit: (data: Omit<Provider, "id">) => void;
  onCancel: () => void;
}

export function ProviderForm({ editing, onSubmit, onCancel }: ProviderFormProps) {
  const [name, setName] = React.useState("");
  const [baseUrl, setBaseUrl] = React.useState("");
  const [apiKey, setApiKey] = React.useState("");
  const [modelsInput, setModelsInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (editing) {
      setName(editing.name);
      setBaseUrl(editing.baseUrl);
      setApiKey(editing.apiKey);
      setModelsInput(editing.models.join(", "));
    } else {
      setName("");
      setBaseUrl("");
      setApiKey("");
      setModelsInput("");
    }
    setError(null);
  }, [editing]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const models = parseModels(modelsInput);
    if (!name.trim() || !baseUrl.trim() || !apiKey.trim() || models.length === 0) {
      setError("请填写 name、baseUrl、apiKey，并至少填写一个 model。");
      return;
    }
    setError(null);
    onSubmit({
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      models,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? "编辑 Provider" : "添加 Provider"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如 OpenAI / DeepSeek / 本地模型"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
            <p className="text-xs text-muted-foreground">
              需填写到兼容 OpenAI 的 /v1 端点。
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
            <p className="text-xs text-muted-foreground">
              仅保存在本浏览器 localStorage，请求时临时传给后端，后端不保存。
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="models">Models（逗号分隔）</Label>
            <Input
              id="models"
              value={modelsInput}
              onChange={(e) => setModelsInput(e.target.value)}
              placeholder="gpt-4o-mini, gpt-4o"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit">{editing ? "保存修改" : "添加"}</Button>
            {editing && (
              <Button type="button" variant="outline" onClick={onCancel}>
                取消编辑
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
