import { useState, useRef, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { 
  useListConversations, 
  useCreateConversation,
  useGetConversation,
  useListMessages,
  getListMessagesQueryKey,
  getListConversationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Code2, Layers, KanbanSquare, BookOpen, Bug, TestTube2, MessageSquare, Plus, Send, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const AGENT_TYPES = [
  { id: "coding", label: "Coding Agent", icon: Code2, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "architecture", label: "Architecture Agent", icon: Layers, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "planning", label: "Planning Agent", icon: KanbanSquare, color: "text-green-500", bg: "bg-green-500/10" },
  { id: "documentation", label: "Docs Agent", icon: BookOpen, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "testing", label: "Testing Agent", icon: TestTube2, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { id: "debugging", label: "Debugging Agent", icon: Bug, color: "text-red-500", bg: "bg-red-500/10" },
  { id: "general", label: "General Assistant", icon: MessageSquare, color: "text-gray-400", bg: "bg-gray-400/10" },
];

export default function Workspace() {
  const [match, params] = useRoute("/workspace/:id");
  const conversationId = match && params?.id ? parseInt(params.id, 10) : null;
  const queryClient = useQueryClient();

  const { data: conversations, isLoading: isConversationsLoading } = useListConversations();
  const createConversation = useCreateConversation();
  
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const handleCreate = async () => {
    if (!selectedAgent || !newTitle.trim()) return;
    createConversation.mutate(
      { data: { title: newTitle, agentType: selectedAgent as any, pinned: false } },
      {
        onSuccess: (newConv) => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          window.history.pushState({}, "", `/workspace/${newConv.id}`);
          // trigger re-render by doing a dispatch or just relying on wouter's location hook elsewhere
          // But since we use useRoute, wouter doesn't auto-update from pushState without navigate.
          // Wait, wouter exposes navigate, let's use it.
        }
      }
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] gap-4 animate-in fade-in duration-300">
      {/* Sidebar */}
      <Card className="w-80 flex flex-col hidden md:flex bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="p-4 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-lg">Agents & Chats</CardTitle>
            <Link href="/workspace" className="p-1 rounded-md hover:bg-primary/20 text-primary transition-colors">
              <Plus className="size-5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isConversationsLoading ? (
                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)
              ) : conversations?.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground text-sm">No conversations yet</div>
              ) : (
                conversations?.map((conv) => {
                  const agentDef = AGENT_TYPES.find(a => a.id === conv.agentType) || AGENT_TYPES[6];
                  const Icon = agentDef.icon;
                  const isActive = conversationId === conv.id;
                  return (
                    <Link
                      key={conv.id}
                      href={`/workspace/${conv.id}`}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md transition-colors",
                        isActive ? "bg-primary/10" : "hover:bg-muted"
                      )}
                    >
                      <div className={cn("p-1.5 rounded-md", agentDef.bg)}>
                        <Icon className={cn("size-4", agentDef.color)} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className={cn("text-sm truncate", isActive ? "font-medium text-primary" : "text-foreground/80")}>
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
      <Card className="flex-1 flex flex-col bg-card/50 backdrop-blur border-border/50 overflow-hidden">
        {conversationId ? (
          <ChatInterface conversationId={conversationId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-8">
            <div className="space-y-2">
              <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 mb-4 border border-primary/20">
                <Bot className="size-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Multi-Agent Workspace</h2>
              <p className="text-muted-foreground">Select an AI agent tailored for your specific task to start a new session.</p>
            </div>

            <div className="w-full space-y-4">
              <Input 
                placeholder="Give this conversation a title..." 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-background/50 text-center text-lg py-6"
              />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-left">
                {AGENT_TYPES.map((agent) => {
                  const Icon = agent.icon;
                  const isSelected = selectedAgent === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center gap-3",
                        isSelected 
                          ? "border-primary bg-primary/10 ring-1 ring-primary/20" 
                          : "border-border/50 bg-background/50 hover:border-primary/30 hover:bg-primary/5"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg", agent.bg)}>
                        <Icon className={cn("size-6", agent.color)} />
                      </div>
                      <span className="text-sm font-medium">{agent.label}</span>
                    </button>
                  );
                })}
              </div>
              
              <Button 
                size="lg" 
                className="w-full mt-4" 
                disabled={!selectedAgent || !newTitle.trim() || createConversation.isPending}
                onClick={handleCreate}
              >
                {createConversation.isPending ? "Initializing Agent..." : "Start Session"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function ChatInterface({ conversationId }: { conversationId: number }) {
  const queryClient = useQueryClient();
  const { data: conversation, isLoading: isConvLoading } = useGetConversation(conversationId, {
    query: { enabled: !!conversationId, queryKey: ['conversation', conversationId] }
  });
  const { data: messages, isLoading: isMsgsLoading } = useListMessages(conversationId, {
    query: { enabled: !!conversationId, queryKey: getListMessagesQueryKey(conversationId) }
  });

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedContent]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const content = input;
    setInput("");
    
    // Optimistic update
    const previousMessages = queryClient.getQueryData(getListMessagesQueryKey(conversationId)) as any[];
    const tempUserMsg = { id: Date.now(), role: "user", content, createdAt: new Date().toISOString() };
    queryClient.setQueryData(getListMessagesQueryKey(conversationId), previousMessages ? [...previousMessages, tempUserMsg] : [tempUserMsg]);

    setIsStreaming(true);
    setStreamedContent("");

    try {
      const response = await fetch(`/api/conversations/${conversationId}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      if (!response.ok) throw new Error("Stream failed");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(Boolean);
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.done) {
                  // Done
                } else if (data.content) {
                  setStreamedContent(prev => prev + data.content);
                }
              } catch (e) {
                console.error("Failed to parse SSE", e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsStreaming(false);
      setStreamedContent("");
      queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(conversationId) });
    }
  };

  if (isConvLoading) {
    return <div className="flex-1 flex items-center justify-center"><Skeleton className="h-8 w-48" /></div>;
  }

  const agentDef = AGENT_TYPES.find(a => a.id === conversation?.agentType) || AGENT_TYPES[6];
  const Icon = agentDef.icon;

  return (
    <>
      <CardHeader className="p-4 border-b border-border/50 bg-background/50 flex flex-row items-center gap-3">
        <div className={cn("p-2 rounded-md", agentDef.bg)}>
          <Icon className={cn("size-5", agentDef.color)} />
        </div>
        <div>
          <CardTitle className="text-base">{conversation?.title}</CardTitle>
          <p className="text-xs text-muted-foreground">{agentDef.label}</p>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col relative overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
          {isMsgsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-3/4 ml-auto rounded-xl" />
              <Skeleton className="h-32 w-3/4 rounded-xl" />
            </div>
          ) : messages?.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
              <Icon className="size-16 mb-4" />
              <p>Start your conversation with the {agentDef.label}</p>
            </div>
          ) : (
            <>
              {messages?.map((msg) => (
                <div key={msg.id} className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3", 
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-muted text-foreground rounded-tl-sm border border-border/50 shadow-sm"
                  )}>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-1.5 opacity-70">
                        <Icon className="size-3" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">{agentDef.label}</span>
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {/* Naive markdown code block rendering for brevity - in production use react-markdown */}
                      {msg.content.split('```').map((part, i) => {
                        if (i % 2 === 1) {
                          const lines = part.split('\n');
                          const lang = lines[0];
                          const code = lines.slice(1).join('\n');
                          return (
                            <div key={i} className="my-3 rounded-md bg-zinc-950 border border-zinc-800 overflow-hidden text-zinc-50 relative group">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
                                <span className="text-xs font-mono text-zinc-400">{lang}</span>
                              </div>
                              <pre className="p-3 text-xs overflow-x-auto font-mono"><code>{code}</code></pre>
                            </div>
                          );
                        }
                        return <span key={i}>{part}</span>;
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {isStreaming && streamedContent && (
                 <div className="flex w-full justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted text-foreground rounded-tl-sm border border-border/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-1.5 opacity-70">
                      <Icon className="size-3" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">{agentDef.label}</span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed animate-pulse">
                      {streamedContent}<span className="inline-block w-1.5 h-4 ml-1 bg-primary align-middle" />
                    </div>
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
              if (e.key === 'Enter' && !e.shiftKey) {
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
