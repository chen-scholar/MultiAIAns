import { ChatForm } from "@/components/chat/ChatForm";

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">对话 / Chat</h1>
        <p className="text-sm text-muted-foreground">
          选择所需的提供商和模型，问你想问的问题 :)
        </p>
      </div>
      <ChatForm />
    </div>
  );
}
