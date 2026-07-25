import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import {
  useListConversations,
  useCreateConversation,
  useListMessages,
  useDeleteConversation,
  getListConversationsQueryKey,
  getListMessagesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Bot,
  Send,
  Plus,
  Code2,
  ArrowDown,
  Menu,
  Trash2,
  MessageSquare,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSSEStream } from "@/hooks/use-sse-stream";
import { useBackgroundJobs } from "@/contexts/background-jobs-context";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { ChatMessageSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";

const SCROLL_THRESHOLD = 100;

function ConversationList({
  conversations,
  isLoading,
  activeConvId,
  onSelect,
  onNewChat,
  onDelete,
  isCreating,
}: {
  conversations: Array<{ id: number; title: string; messageCount?: number }>;
  isLoading: boolean;
  activeConvId: number | null;
  onSelect: (id: number) => void;
  onNewChat: () => void;
  onDelete?: (id: number) => void;
  isCreating?: boolean;
}) {
  return (
    <>
      <div className="p-4 border-b border-border/50">
        <Button onClick={onNewChat} disabled={isCreating} className="w-full">
          <Plus className="size-4 mr-2" /> New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              <div className="h-9 bg-muted animate-pulse rounded-md" />
              <div className="h-9 bg-muted animate-pulse rounded-md w-3/4" />
              <div className="h-9 bg-muted animate-pulse rounded-md w-5/6" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <MessageSquare className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Create one to get started</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    "w-full text-left p-2.5 pr-8 rounded-lg transition-all duration-150 text-sm truncate border border-transparent",
                    activeConvId === conv.id
                      ? "bg-primary/10 text-primary font-medium border-primary/20 shadow-sm"
                      : "hover:bg-muted/70 text-foreground/80 hover:text-foreground",
                  )}
                >
                  <span className="truncate block">{conv.title}</span>
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                    title="Delete conversation"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </>
  );
}

export default function Assistant() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/assistant/:conversationId?");
  const queryClient = useQueryClient();
  const sseStream = useSSEStream();
  const { addJob } = useBackgroundJobs();

  const { data: conversations = [], isLoading: isConvListLoading } = useListConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();

  // Resolve conversation ID from path param
  const rawId = match ? params?.conversationId : undefined;
  const activeConvId = rawId ? parseInt(rawId, 10) : null;

  const [input, setInput] = useState("");
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // All conversations from API
  const allConversations = conversations || [];

  // Direct message loading — clean and simple like the Workspace page
  const {
    data: messages = [],
    isLoading: isMessagesLoading,
  } = useListMessages(activeConvId ?? 0, {
    query: {
      queryKey: getListMessagesQueryKey(activeConvId ?? 0),
      enabled: activeConvId !== null && activeConvId > 0,
    },
  });

  const isStreaming = sseStream.isStreaming;

  const scrollToBottom = useCallback((smooth = true) => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
      setIsNearBottom(true);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsNearBottom(distanceFromBottom < SCROLL_THRESHOLD);
  }, []);

  // Auto-scroll on new messages or streaming content
  useEffect(() => {
    if (isNearBottom && (messages.length > 0 || sseStream.streamedContent)) {
      scrollToBottom(true);
    }
  }, [messages, sseStream.streamedContent, isNearBottom, scrollToBottom]);

  useEffect(() => {
    if (activeConvId !== null) {
      scrollToBottom(false);
    }
  }, [activeConvId, scrollToBottom]);

  const handleNewChat = () => {
    createConversation.mutate(
      { data: { title: "New Chat", agentType: "coding", pinned: false } },
      {
        onSuccess: (newConv) => {
          queryClient.setQueryData(getListConversationsQueryKey(), (old: typeof conversations) => {
            if (!old) return [newConv];
            return [newConv, ...old];
          });
          navigate(`/assistant/${newConv.id}`);
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setMobileSheetOpen(false);
        },
        onError: () => {
          toast.error("Failed to create new chat");
        },
      },
    );
  };

  const handleSelectConversation = (id: number) => {
    navigate(`/assistant/${id}`);
    setMobileSheetOpen(false);
  };

  const handleDeleteConversation = (id: number) => {
    const wasActive = activeConvId === id;
    deleteConversation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          toast.success("Conversation deleted");

          if (wasActive) {
            const remaining = allConversations.filter((c) => c.id !== id);
            if (remaining.length > 0) {
              navigate(`/assistant/${remaining[0].id}`);
            } else {
              navigate("/assistant", { replace: true });
            }
          }
        },
        onError: () => {
          toast.error("Failed to delete conversation");
        },
      },
    );
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !activeConvId) return;
    const content = input;
    setInput("");

    queryClient.setQueryData(getListMessagesQueryKey(activeConvId), (old: typeof messages) => {
      return [
        ...(old ?? []),
        { id: `temp-${Date.now()}`, role: "user", content, createdAt: new Date().toISOString() },
      ];
    });

    const job = addJob({
      type: "conversation",
      title: `Conversation #${activeConvId}`,
      prompt: content,
      status: "generating",
    });

    try {
      sseStream.start({
        url: `/api/conversations/${activeConvId}/stream`,
        body: { content },
        jobId: job.id,
        onError: (error: string) => {
          toast.error("Stream failed", { description: error });
        },
        onComplete: () => {
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(activeConvId) });
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        },
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] gap-4 animate-in fade-in duration-300">
      {/* Desktop Sidebar */}
      <Card className="w-72 hidden md:flex flex-col bg-card/50 backdrop-blur overflow-hidden">
        <ConversationList
          conversations={allConversations}
          isLoading={isConvListLoading}
          activeConvId={activeConvId}
          onSelect={handleSelectConversation}
          onNewChat={handleNewChat}
          onDelete={handleDeleteConversation}
          isCreating={createConversation.isPending}
        />
      </Card>

      {/* Mobile Sheet */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="md:hidden fixed top-4 left-4 z-20 size-10 rounded-full bg-background/80 backdrop-blur border border-border shadow-sm flex items-center justify-center hover:bg-accent transition-all"
          >
            <Menu className="size-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <div className="flex items-center gap-2 p-4 border-b border-border/50">
            <div className="size-8 rounded-md bg-primary/20 flex items-center justify-center border border-primary/30">
              <Bot className="size-4 text-primary" />
            </div>
            <span className="font-semibold text-sm">Chat History</span>
          </div>
          <ConversationList
            conversations={allConversations}
            isLoading={isConvListLoading}
            activeConvId={activeConvId}
            onSelect={handleSelectConversation}
            onNewChat={handleNewChat}
            onDelete={handleDeleteConversation}
            isCreating={createConversation.isPending}
          />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col bg-card/50 backdrop-blur overflow-hidden relative">
        <div className="p-4 border-b border-border/50 bg-background/50 flex items-center gap-3">
          <div className="md:hidden size-8" /> {/* Spacer for mobile menu button */}
          <Code2 className="size-5 text-foreground shrink-0" />
          <h2 className="font-semibold">AI Coding Assistant</h2>
          {activeConvId && (
            <span className="text-xs text-muted-foreground ml-auto hidden sm:block">
              {allConversations.find((c) => c.id === activeConvId)?.title ?? "Chat"}
            </span>
          )}
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-4 relative"
        >
          {!activeConvId ? (
            <EmptyState
              icon={History}
              title="No conversation selected"
              description="Select a conversation from the sidebar or create a new chat to begin"
              action={
                <Button onClick={handleNewChat} disabled={createConversation.isPending} className="mt-4">
                  <Plus className="size-4 mr-2" />
                  New Chat
                </Button>
              }
            />
          ) : isMessagesLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="space-y-4 w-full max-w-lg">
                <ChatMessageSkeleton isUser />
                <ChatMessageSkeleton />
                <ChatMessageSkeleton isUser />
              </div>
            </div>
          ) : messages.length === 0 && !isStreaming ? (
            <EmptyState
              icon={Bot}
              title="Start a conversation"
              description="Send a message below to start chatting with the AI assistant"
            />
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-full",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <MarkdownViewer content={msg.content} />
                    ) : (
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && sseStream.streamedContent && (
                <div className="flex w-full justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted">
                    <MarkdownViewer content={sseStream.streamedContent} />
                    <span className="inline-block w-1.5 h-4 ml-1 bg-primary align-middle animate-pulse" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {!isNearBottom && messages.length > 0 && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-24 right-8 z-10 size-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all animate-in fade-in slide-in-from-bottom-2"
          >
            <ArrowDown className="size-5" />
          </button>
        )}

        <div className="p-4 border-t border-border/50 bg-background/30">
          <div className="flex gap-2 items-end">
            <Textarea
              placeholder={
                activeConvId
                  ? "Ask the coding assistant..."
                  : "Create or select a conversation to start chatting"
              }
              className="min-h-[44px] max-h-32 resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={!activeConvId}
            />
            <Button
              size="icon"
              className="h-[44px] w-[44px] shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming || !activeConvId}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
