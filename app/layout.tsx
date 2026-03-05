import type { Metadata } from "next";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "MultiAIAns Prototype",
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('multiaians.theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <header className="border-b">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-semibold">
              MultiAIAns
            </Link>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Chat
              </Link>
              <Link href="/docs" className="hover:text-foreground">
                Docs
              </Link>
              <Link href="/history" className="hover:text-foreground">
                History
              </Link>
              <Link href="/settings" className="hover:text-foreground">
                Settings
              </Link>
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
