import { readFile } from "fs/promises";
import path from "path";

import { Markdown } from "@/components/markdown";

// 每次请求时读取根目录的 docs.md（本地文件，开销很小）
export const dynamic = "force-dynamic";

async function readDocs(): Promise<string | null> {
  try {
    return await readFile(path.join(process.cwd(), "docs.md"), "utf8");
  } catch {
    return null;
  }
}

export default async function DocsPage() {
  const content = await readDocs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Docs</h1>
        <p className="text-sm text-muted-foreground">
          内容来自项目根目录的 docs.md，改那个文件即可更新。
        </p>
      </div>

      {content ? (
        <Markdown>{content}</Markdown>
      ) : (
        <p className="text-sm text-muted-foreground">
          没找到 docs.md，请在项目根目录创建它。
        </p>
      )}
    </div>
  );
}
