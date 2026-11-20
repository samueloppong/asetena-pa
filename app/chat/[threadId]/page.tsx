import { ChatWindow } from "@/components/chat/ChatWindow";

interface PageProps {
  params: Promise<{ threadId: string }>;
}

export default async function ChatThreadPage({ params }: PageProps) {
  const { threadId } = await params;
  return <ChatWindow threadId={threadId} />;
}
