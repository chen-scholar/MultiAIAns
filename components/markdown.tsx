import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// 统一的 Markdown 渲染组件，Chat 回答卡片和 Docs 页面共用。
// 默认不渲染原始 HTML（react-markdown 默认行为），避免 XSS。
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:bg-muted prose-pre:text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 宽表格不要撑破卡片，包一层横向滚动
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto">
              <table {...props} />
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
