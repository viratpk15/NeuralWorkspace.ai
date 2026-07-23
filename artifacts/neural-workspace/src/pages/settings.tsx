import { useState } from "react";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const [workspaceName, setWorkspaceName] = useState(settings?.workspaceName || "");
  const [aiModel, setAiModel] = useState(settings?.aiModel || "gpt-4");
  const [memoryEnabled, setMemoryEnabled] = useState(settings?.memoryEnabled ?? true);

  // Sync state when settings load
  useState(() => {
    if (settings) {
      setWorkspaceName(settings.workspaceName);
      setAiModel(settings.aiModel);
      setMemoryEnabled(settings.memoryEnabled ?? true);
    }
  });

  const handleSave = () => {
    updateSettings.mutate(
      {
        data: {
          workspaceName,
          aiModel,
          memoryEnabled,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          toast.success("Settings saved");
        },
        onError: () => {
          toast.error("Failed to save settings");
        }
      }
    );
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as "dark" | "light" | "system");
    updateSettings.mutate(
      { data: { theme: newTheme as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
          <SettingsIcon className="size-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground">Configure your workspace preferences and AI behavior.</p>
      </div>

      <div className="space-y-6">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Basic workspace configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Workspace Name</label>
              <Input 
                placeholder="My Neural Workspace"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Theme</label>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>AI Configuration</CardTitle>
            <CardDescription>Choose the model and memory settings for your agents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Model</label>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Enable Workspace Memory</label>
                <p className="text-xs text-muted-foreground">Allow agents to access saved memory items for context</p>
              </div>
              <Switch 
                checked={memoryEnabled} 
                onCheckedChange={setMemoryEnabled}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            <Save className="size-4 mr-2" />
            {updateSettings.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
