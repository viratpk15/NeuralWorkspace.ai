import { useState } from "react";
import { 
  useListMemoryItems, 
  useCreateMemoryItem,
  useUpdateMemoryItem,
  useDeleteMemoryItem,
  getListMemoryItemsQueryKey,
  MemoryItemInputCategory
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, Pin, Search, Plus, Trash2, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const CATEGORIES = ["context", "requirements", "decisions", "notes", "documentation", "preferences", "general"];

const CATEGORY_COLORS = {
  context: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  requirements: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  decisions: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  notes: "bg-green-500/10 text-green-500 border-green-500/20",
  documentation: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  preferences: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  general: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default function Memory() {
  const { data: items, isLoading } = useListMemoryItems();
  const createItem = useCreateMemoryItem();
  const updateItem = useUpdateMemoryItem();
  const deleteItem = useDeleteMemoryItem();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState<MemoryItemInputCategory>("general");
  const [formTags, setFormTags] = useState("");

  const handleSubmit = () => {
    if (!formTitle.trim() || !formContent.trim()) return;

    const data = {
      title: formTitle,
      content: formContent,
      category: formCategory,
      tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      pinned: false,
    };

    if (editingItem) {
      updateItem.mutate(
        { id: editingItem, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListMemoryItemsQueryKey() });
            toast.success("Memory updated");
            resetForm();
          }
        }
      );
    } else {
      createItem.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListMemoryItemsQueryKey() });
            toast.success("Memory saved");
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
    setEditingItem(null);
    setDialogOpen(false);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item.id);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormCategory(item.category);
    setFormTags(item.tags?.join(', ') || "");
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this memory item?")) return;
    deleteItem.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMemoryItemsQueryKey() });
          toast.success("Memory deleted");
        }
      }
    );
  };

  const togglePin = (id: number, currentPinned: boolean) => {
    updateItem.mutate(
      { id, data: { pinned: !currentPinned } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMemoryItemsQueryKey() });
        }
      }
    );
  };

  const filteredItems = items?.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <Database className="size-8 text-green-500" />
            Workspace Memory
          </h1>
          <p className="text-muted-foreground">Persistent context and knowledge for your AI agents.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" /> New Memory
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Memory" : "New Memory Item"}</DialogTitle>
              <DialogDescription>Store important context, decisions, or notes for your workspace.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input 
                  placeholder="E.g. API Authentication Strategy"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={formCategory} onValueChange={(v: any) => setFormCategory(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea 
                  placeholder="Detailed information, context, or decisions..."
                  className="min-h-[150px] resize-none"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input 
                  placeholder="auth, jwt, security"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!formTitle.trim() || !formContent.trim()}>
                {editingItem ? "Update" : "Save"}
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
              <Input 
                placeholder="Search memories..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
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
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Database className="size-16 opacity-50 mb-4" />
            <p>No memory items found.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <Card key={item.id} className="bg-card/50 backdrop-blur hover:border-primary/50 transition-colors group relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
                  <button 
                    onClick={() => togglePin(item.id, item.pinned)}
                    className={cn(
                      "shrink-0 p-1 rounded transition-colors",
                      item.pinned ? "text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <Pin className={cn("size-4", item.pinned && "fill-current")} />
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className={cn("text-[10px] capitalize", CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS])}>
                    {item.category}
                  </Badge>
                  {item.tags?.slice(0, 2).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {item.content}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(item.createdAt), "MMM d, yyyy")}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleEdit(item)}>
                      <Edit2 className="size-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => handleDelete(item.id)}>
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
