import { ChatForm } from "@/components/chat/ChatForm";

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Chat</h1>
        <p className="text-sm text-muted-foreground">
          选择一个 Provider 和 Model，问一个问题。
        </p>
      </div>
      <ChatForm />
    </div>
  );
}
