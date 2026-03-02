"use client";

import * as React from "react";
import Link from "next/link";

import { AnswerBox } from "@/components/chat/AnswerBox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadProviders } from "@/lib/storage/providers";
import type { ChatResult, Provider } from "@/lib/types";

export function ChatForm() {
  const [providers, setProviders] = React.useState<Provider[]>([]);
  const [providerId, setProviderId] = React.useState<string>("");
  const [model, setModel] = React.useState<string>("");
  const [prompt, setPrompt] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ChatResult | null>(null);

  React.useEffect(() => {
    setProviders(loadProviders());
  }, []);

  const selectedProvider = providers.find((p) => p.id === providerId) ?? null;

  function handleProviderChange(id: string) {
    setProviderId(id);
    const next = providers.find((p) => p.id === id) ?? null;
    setModel(next?.models[0] ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!selectedProvider) {
      setError("请先选择一个 Provider。");
      return;
    }
    if (!model) {
      setError("请选择一个 Model。");
      return;
    }
    if (!prompt.trim()) {
      setError("请输入问题。");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/multi-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: selectedProvider.baseUrl,
          apiKey: selectedProvider.apiKey,
          model,
          prompt: prompt.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "请求失败");
        return;
      }
      setResult(data as ChatResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络请求失败");
    } finally {
      setLoading(false);
    }
  }

  if (providers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        还没有配置 Provider，请先去{" "}
        <Link href="/settings" className="underline">
          Settings
        </Link>{" "}
        添加。
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={providerId} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue placeholder="选择 Provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <Select
              value={model}
              onValueChange={setModel}
              disabled={!selectedProvider}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择 Model" />
              </SelectTrigger>
              <SelectContent>
                {selectedProvider?.models.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt">问题</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="输入你的问题…"
            rows={5}
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "发送中…" : "发送"}
        </Button>
      </form>

      {error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {result && <AnswerBox result={result} />}
    </div>
  );
}
