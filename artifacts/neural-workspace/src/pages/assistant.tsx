import { useState, useRef, useEffect } from "react";
import { useListConversations, useCreateConversation, getListConversationsQueryKey, getListMessagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Plus, Code2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Assistant() {
  const queryClient = useQueryClient();
  const { data: conversations } = useListConversations();
  const createConversation = useCreateConversation();

  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const codingConversations = conversations?.filter(c => c.agentType === "coding") || [];

  useEffect(() => {
    if (codingConversations.length > 0 && !activeConvId) {
      setActiveConvId(codingConversations[0].id);
    }
  }, [codingConversations, activeConvId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedContent]);

  const handleNewChat = () => {
    createConversation.mutate(
      { data: { title: "New Chat", agentType: "coding", pinned: false } },
      {
        onSuccess: (newConv) => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setActiveConvId(newConv.id);
          setMessages([]);
        }
      }
    );
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !activeConvId) return;
    const content = input;
    setInput("");
    
    const tempUserMsg = { id: Date.now(), role: "user", content, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);

    setIsStreaming(true);
    setStreamedContent("");

    try {
      const response = await fetch(`/api/conversations/${activeConvId}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

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
                if (data.content) {
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
      // Refetch messages from server
      queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(activeConvId) });
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] gap-4 animate-in fade-in duration-300">
      <Card className="w-64 hidden md:flex flex-col bg-card/50 backdrop-blur p-4 gap-3">
        <Button onClick={handleNewChat} disabled={createConversation.isPending}>
          <Plus className="size-4 mr-2" /> New Chat
        </Button>
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {codingConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={cn(
                  "w-full text-left p-2 rounded-md transition-colors text-sm truncate",
                  activeConvId === conv.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                {conv.title}
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="flex-1 flex flex-col bg-card/50 backdrop-blur overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-background/50 flex items-center gap-3">
          <Code2 className="size-5 text-blue-500" />
          <h2 className="font-semibold">AI Coding Assistant</h2>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !activeConvId ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
              <Bot className="size-16 mb-4" />
              <p>Start a new chat to begin coding with AI</p>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <div key={msg.id} className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3",
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isStreaming && streamedContent && (
                <div className="flex w-full justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted animate-pulse">
                    <div className="text-sm whitespace-pre-wrap">{streamedContent}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-border/50 bg-background/30">
          <div className="flex gap-2 items-end">
            <Textarea 
              placeholder="Ask the coding assistant..."
              className="min-h-[44px] max-h-32 resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button size="icon" className="h-[44px] w-[44px] shrink-0" onClick={handleSend} disabled={!input.trim() || isStreaming}>
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
