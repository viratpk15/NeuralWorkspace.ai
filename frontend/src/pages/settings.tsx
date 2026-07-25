import { useState, useEffect } from "react";
import {
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import type { SettingsUpdate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, CheckCircle2, Brain, Zap, Shield, Palette } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { NWLogo } from "@/components/nw-logo";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const [workspaceName, setWorkspaceName] = useState(settings?.workspaceName || "");
  const [aiProvider, setAiProvider] = useState("auto");
  const [memoryEnabled, setMemoryEnabled] = useState(settings?.memoryEnabled ?? true);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [saveFeedback, setSaveFeedback] = useState<"idle" | "saving" | "saved">("idle");

  // Sync state when settings load
  useEffect(() => {
    if (settings) {
      setWorkspaceName(settings.workspaceName);
      setMemoryEnabled(settings.memoryEnabled ?? true);
    }
  }, [settings]);

  const handleSave = () => {
    setSaveFeedback("saving");
    updateSettings.mutate(
      {
        data: {
          workspaceName,
          memoryEnabled,
        } as SettingsUpdate,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          setSaveFeedback("saved");
          toast.success("Settings saved");
          setTimeout(() => setSaveFeedback("idle"), 2000);
        },
        onError: () => {
          setSaveFeedback("idle");
          toast.error("Failed to save settings");
        },
      },
    );
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as "dark" | "light" | "system");
    updateSettings.mutate(
      { data: { theme: newTheme as SettingsUpdate["theme"] } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        },
      },
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
          <NWLogo size="md" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your workspace preferences, AI behavior, and system settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-5 text-primary" />
              General
            </CardTitle>
            <CardDescription>Basic workspace configuration and appearance</CardDescription>
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

            <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Auto-save Changes</label>
                <p className="text-xs text-muted-foreground">
                  Automatically save settings and preferences
                </p>
              </div>
              <Switch checked={autoSave} onCheckedChange={setAutoSave} />
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="size-5 text-primary" />
              AI Configuration
            </CardTitle>
            <CardDescription>
              Choose your preferred AI provider. The backend will automatically select the best available model.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Provider</label>
              <Select value={aiProvider} onValueChange={setAiProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (Best Available)</SelectItem>
                  <SelectItem value="ollama">Ollama (Local)</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="gpt">OpenAI GPT</SelectItem>
                  <SelectItem value="groq">Groq</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                When set to "Auto", the system will use the first available provider from your configured API keys.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Enable Streaming</label>
                <p className="text-xs text-muted-foreground">
                  Stream AI responses in real-time for better user experience
                </p>
              </div>
              <Switch checked={streamingEnabled} onCheckedChange={setStreamingEnabled} />
            </div>

            <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Enable Workspace Memory</label>
                <p className="text-xs text-muted-foreground">
                  Allow agents to access saved memory items for context
                </p>
              </div>
              <Switch checked={memoryEnabled} onCheckedChange={setMemoryEnabled} />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5 text-primary" />
              Advanced
            </CardTitle>
            <CardDescription>Additional configuration options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Debug Mode</label>
                <p className="text-xs text-muted-foreground">
                  Enable verbose logging for troubleshooting
                </p>
              </div>
              <Switch checked={false} onCheckedChange={() => {}} disabled />
            </div>

            <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Experimental Features</label>
                <p className="text-xs text-muted-foreground">
                  Enable beta features and experimental functionality
                </p>
              </div>
              <Switch checked={false} onCheckedChange={() => {}} disabled />
            </div>
          </CardContent>
        </Card>

        {/* API Configuration Info */}
        <Card className="bg-card/50 backdrop-blur border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Your API keys are securely stored and managed by the backend. Contact your administrator to configure providers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span>Ollama (Local)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span>Google Gemini</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span>OpenAI GPT</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span>Groq</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateSettings.isPending || saveFeedback === "saving"}>
            {saveFeedback === "saving" ? (
              <>
                <Spinner className="size-4 mr-2" />
                Saving...
              </>
            ) : saveFeedback === "saved" ? (
              <>
                <CheckCircle2 className="size-4 mr-2 text-green-500" />
                Saved
              </>
            ) : (
              <>
                <Save className="size-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
