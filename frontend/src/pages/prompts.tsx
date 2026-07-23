import { useState } from "react";
import { 
  useListPrompts, 
  useCreatePrompt,
  useUpdatePrompt,
  useDeletePrompt,
  getListPromptsQueryKey,

} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Star, Search, Plus, Trash2, Edit2, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES = ["coding", "architecture", "planning", "documentation", "testing", "debugging", "general"];

export default function Prompts() {
  const { data: prompts, isLoading } = useListPrompts();
  const createPrompt = useCreatePrompt();
  const updatePrompt = useUpdatePrompt();
  const deletePrompt = useDeletePrompt();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState<string>("general");
  const [formTags, setFormTags] = useState("");

  const handleSubmit = () => {
    if (!formTitle.trim() || !formContent.trim()) return;

    const data = {
      title: formTitle,
      content: formContent,
      category: formCategory,
      tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      favorite: false,
    };

    if (editingId) {
      updatePrompt.mutate(
        { id: editingId, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() });
            toast.success("Prompt updated");
            resetForm();
          }
        }
      );
    } else {
      createPrompt.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() });
            toast.success("Prompt saved");
            resetForm();
          }
        }
      );
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormCategory("general");
    setFormTags("");
    setEditingId(null);
    setDialogOpen(false);
  };

  const handleEdit = (prompt: any) => {
    setEditingId(prompt.id);
    setFormTitle(prompt.title);
    setFormContent(prompt.content);
    setFormCategory(prompt.category);
    setFormTags(prompt.tags?.join(', ') || "");
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this prompt?")) return;
    deletePrompt.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() });
        toast.success("Prompt deleted");
      }
    });
  };

  const toggleFavorite = (id: number, currentFav: boolean) => {
    updatePrompt.mutate(
      { id, data: { favorite: !currentFav } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() });
        }
      }
    );
  };

  const copyPrompt = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Prompt copied to clipboard");
  };

  const filteredPrompts = prompts?.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <MessageSquare className="size-8 text-amber-500" />
            Prompt Library
          </h1>
          <p className="text-muted-foreground">Reusable prompts for your AI agents.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" /> New Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Prompt" : "New Prompt"}</DialogTitle>
              <DialogDescription>Create a reusable prompt template.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input placeholder="E.g. Code Review Checklist" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={formCategory} onValueChange={(v: any) => setFormCategory(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prompt Content</label>
                <Textarea placeholder="Your prompt template..." className="min-h-[200px] resize-none font-mono text-sm" value={formContent} onChange={(e) => setFormContent(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input placeholder="review, best-practices, security" value={formTags} onChange={(e) => setFormTags(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!formTitle.trim() || !formContent.trim()}>
                {editingId ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search prompts..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
        ) : filteredPrompts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageSquare className="size-16 opacity-50 mb-4" />
            <p>No prompts found.</p>
          </div>
        ) : (
          filteredPrompts.map(prompt => (
            <Card key={prompt.id} className="bg-card/50 backdrop-blur hover:border-primary/50 transition-colors group relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{prompt.title}</CardTitle>
                  <button 
                    onClick={() => toggleFavorite(prompt.id, prompt.favorite)}
                    className={cn(
                      "shrink-0 p-1 rounded transition-colors",
                      prompt.favorite ? "text-amber-500" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <Star className={cn("size-4", prompt.favorite && "fill-current")} />
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] capitalize">{prompt.category}</Badge>
                  {prompt.tags?.slice(0, 2).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground font-mono line-clamp-4 leading-relaxed bg-muted/30 p-2 rounded">
                  {prompt.content}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">v{prompt.version}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => copyPrompt(prompt.content)}>
                      <Copy className="size-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleEdit(prompt)}>
                      <Edit2 className="size-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => handleDelete(prompt.id)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
