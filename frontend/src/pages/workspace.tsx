import { useState, useRef, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import {
  useListConversations,
  useCreateConversation,
  useGetConversation,
  useListMessages,
  getGetConversationQueryKey,
  getListMessagesQueryKey,
  getListConversationsQueryKey,
} from "@workspace/api-client-react";
import type { ConversationInput, Message } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  MessageSquare,
  Plus,
  Send,
} from "lucide-react";
import { AgentBadge } from "@/components/status-indicator";
import type { AgentType } from "@/components/status-indicator";
import { cn } from "@/lib/utils";
import { useSSEStream } from "@/hooks/use-sse-stream";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { ChatMessageSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";

const AGENT_TYPES = [
  { id: "coding", label: "Coding Agent" },
  { id: "architecture", label: "Architecture Agent" },
  { id: "planning", label: "Planning Agent" },
  { id: "documentation", label: "Docs Agent" },
  { id: "testing", label: "Testing Agent" },
  { id: "debugging", label: "Debugging Agent" },
  { id: "general", label: "General Assistant" },
];

export default function Workspace() {
  const [match, params] = useRoute("/workspace/:id");
  const [, navigate] = useLocation();
  const conversationId = match && params?.id ? parseInt(params.id, 10) : null;
  const queryClient = useQueryClient();

  const { data: conversations, isLoading: isConversationsLoading } = useListConversations();
  const createConversation = useCreateConversation();

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const handleCreate = async () => {
    if (!selectedAgent || !newTitle.trim()) return;
    createConversation.mutate(
      { data: { title: newTitle, agentType: selectedAgent as ConversationInput["agentType"], pinned: false } as ConversationInput },
      {
        onSuccess: (newConv) => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          navigate(`/workspace/${newConv.id}`, { replace: true });
        },
      },
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] gap-4 animate-in fade-in duration-300">
      {/* Sidebar */}
      <Card className="w-80 flex flex-col hidden md:flex bg-card border-border/50">
        <CardHeader className="p-4 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-lg">Agents & Chats</CardTitle>
            <Link
              href="/workspace"
              className="p-1 rounded-md hover:bg-muted transition-colors"
            >
              <Plus className="size-5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isConversationsLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)
              ) : conversations?.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No conversations yet"
                  description="Create a new conversation to get started."
                />
              ) : (
                conversations?.map((conv) => {
                  const isActive = conversationId === conv.id;
                  return (
                    <Link
                      key={conv.id}
                      href={`/workspace/${conv.id}`}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-colors",
                        isActive ? "bg-muted" : "hover:bg-muted/50",
                      )}
                    >
                      <AgentBadge agentType={conv.agentType as AgentType} showIcon size="sm" />
                      <div className="flex-1 overflow-hidden">
                        <p
                          className={cn(
                            "text-sm truncate",
                            isActive ? "font-medium text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {conv.title}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Area */}
      <Card className="flex-1 flex flex-col bg-card border-border/50 overflow-hidden">
        {conversationId ? (
          <ChatInterface conversationId={conversationId} />
        ) : (
          <div className="flex-1 flex flex-col overflow-y-auto p-6">
            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
              <div className="text-center mb-6">
                <div className="inline-flex size-14 items-center justify-center rounded-xl bg-muted mb-3 border border-border">
                  <Bot className="size-7 text-foreground/80" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Multi-Agent Workspace</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Select an AI agent tailored for your specific task to start a new session.
                </p>
              </div>

              <Input
                placeholder="Give this conversation a title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-background/50 text-center mb-4"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-4">
                 {AGENT_TYPES.map((agent) => {
                  const isSelected = selectedAgent === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center gap-3 h-full min-h-[120px]",
                        isSelected
                          ? "border-foreground/40 bg-muted ring-2 ring-foreground/10"
                          : "border-border/50 bg-background/50 hover:border-foreground/20 hover:bg-muted/50",
                      )}
                    >
                      <AgentBadge agentType={agent.id as AgentType} showIcon size="md" />
                      <span className="text-sm font-medium">{agent.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-auto pt-2">
                <Button
                  size="lg"
                  className="w-full"
                  disabled={!selectedAgent || !newTitle.trim() || createConversation.isPending}
                  onClick={handleCreate}
                >
                  {createConversation.isPending ? "Initializing Agent..." : "Start Session"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function ChatInterface({ conversationId }: { conversationId: number }) {
  const queryClient = useQueryClient();
  const sseStream = useSSEStream();
  const { data: conversation, isLoading: isConvLoading } = useGetConversation(conversationId, {
    query: { enabled: !!conversationId, queryKey: getGetConversationQueryKey(conversationId) },
  });
  const { data: messages, isLoading: isMsgsLoading } = useListMessages(conversationId, {
    query: { enabled: !!conversationId, queryKey: getListMessagesQueryKey(conversationId) },
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreaming = sseStream.isStreaming;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sseStream.streamedContent]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const content = input;
    setInput("");

    // Optimistic update
    const previousMessages = queryClient.getQueryData<
      Message[]
    >(getListMessagesQueryKey(conversationId));
    const tempUserMsg = {
      id: Date.now(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    queryClient.setQueryData(
      getListMessagesQueryKey(conversationId),
      previousMessages ? [...previousMessages, tempUserMsg] : [tempUserMsg],
    );

    try {
      sseStream.start({
        url: `/api/conversations/${conversationId}/stream`,
        body: { content },
        onError: (error: string) => {
          toast.error("Stream failed", { description: error });
        },
        onComplete: () => {
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(conversationId) });
        },
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message");
    }
  };

  if (isConvLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return (
    <>
      <CardHeader className="p-4 border-b border-border/50 bg-background/50 flex flex-row items-center gap-3">
        <AgentBadge agentType={conversation?.agentType as AgentType} showIcon size="md" />
        <div>
          <CardTitle className="text-base">{conversation?.title}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col relative overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
          {isMsgsLoading ? (
            <div className="space-y-4">
              <ChatMessageSkeleton isUser />
              <ChatMessageSkeleton />
            </div>
          ) : !messages || messages.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Chat with agent"
              description="Send a message to start the conversation."
            />
          ) : (
            <>
                    {messages.map((msg) => {
                  const agentType = msg.role === "assistant" ? conversation?.agentType : undefined;
                  return (
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
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted text-foreground rounded-tl-sm border border-border/50 shadow-sm",
                        )}
                      >
                        {msg.role === "assistant" && agentType && (
                          <div className="flex items-center gap-2 mb-1.5 opacity-70">
                            <AgentBadge agentType={agentType as AgentType} showIcon size="sm" />
                          </div>
                        )}
                        {msg.role === "assistant" ? (
                          <MarkdownViewer content={msg.content} />
                        ) : (
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              {isStreaming && sseStream.streamedContent && (
                <div className="flex w-full justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted text-foreground rounded-tl-sm border border-border/50 shadow-sm">
                    {conversation?.agentType && (
                      <div className="flex items-center gap-2 mb-1.5 opacity-70">
                        <AgentBadge agentType={conversation.agentType as AgentType} showIcon size="sm" />
                      </div>
                    )}
                    <MarkdownViewer content={sseStream.streamedContent} />
                    <span className="inline-block w-1.5 h-4 ml-1 bg-primary align-middle animate-pulse" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 border-t border-border/50 bg-background/30">
        <div className="flex w-full gap-2 items-end">
          <Textarea
            placeholder="Send a message..."
            className="min-h-[44px] max-h-32 resize-none bg-background"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="icon"
            className="h-[44px] w-[44px] shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </CardFooter>
    </>
  );
}
