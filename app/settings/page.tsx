"use client";

import * as React from "react";

import { ProviderForm } from "@/components/settings/ProviderForm";
import { ProviderList } from "@/components/settings/ProviderList";
import {
  createId,
  loadProviders,
  saveProviders,
} from "@/lib/storage/providers";
import type { Provider } from "@/lib/types";

export default function SettingsPage() {
  const [providers, setProviders] = React.useState<Provider[]>([]);
  const [editing, setEditing] = React.useState<Provider | null>(null);

  React.useEffect(() => {
    setProviders(loadProviders());
  }, []);

  function persist(next: Provider[]) {
    setProviders(next);
    saveProviders(next);
  }

  function handleSubmit(data: Omit<Provider, "id">) {
    if (editing) {
      persist(
        providers.map((p) => (p.id === editing.id ? { ...data, id: p.id } : p))
      );
      setEditing(null);
    } else {
      persist([...providers, { ...data, id: createId() }]);
    }
  }

  function handleDelete(id: string) {
    persist(providers.filter((p) => p.id !== id));
    if (editing?.id === id) setEditing(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          配置 OpenAI-compatible 的 Provider，保存在本地浏览器。
        </p>
      </div>

      <ProviderList
        providers={providers}
        onEdit={setEditing}
        onDelete={handleDelete}
      />

      <ProviderForm
        editing={editing}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(null)}
      />
    </div>
  );
}
