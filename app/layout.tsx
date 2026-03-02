import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "MultiAIAns",
  description: "轻量的多模型问答工具",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <header className="border-b">
          <nav className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-semibold">
              MultiAIAns
            </Link>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Chat
              </Link>
              <Link href="/settings" className="hover:text-foreground">
                Settings
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
