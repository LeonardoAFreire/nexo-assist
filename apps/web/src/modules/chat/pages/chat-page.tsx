import { ChatLoadError, ChatLoading } from '../components/chat-load-state.js';
import { ChatScreen } from '../components/chat-screen.js';
import { useConversation } from '../hooks/use-conversation.js';

function ChatContent() {
  const conversation = useConversation();
  if (conversation.isPending) {
    return <ChatLoading />;
  }
  if (conversation.isError) {
    return <ChatLoadError onRetry={() => void conversation.refetch()} />;
  }

  return <ChatScreen view={conversation.data} />;
}

export function ChatPage() {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <h1 className="sr-only">Atendimento</h1>
      <ChatContent />
    </section>
  );
}
