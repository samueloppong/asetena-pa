import { ChatThreadList } from "@/components/chat/ChatThreadList";

export default function ChatPage() {
  return (
    <main className="min-h-[70vh] pb-20">
      <div className="sticky top-0 z-10 border-b border-border/80 bg-white/90 px-4 py-4 backdrop-blur-xl">
        <h1 className="text-xl font-extrabold tracking-tight text-brand">
          Messages
        </h1>
      </div>
      <ChatThreadList />
    </main>
  );
}
