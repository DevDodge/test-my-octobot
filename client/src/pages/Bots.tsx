import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Bot, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function BotsPage() {
  const utils = trpc.useUtils();
  const { data: bots, isLoading } = trpc.bots.list.useQuery();
  const createBot = trpc.bots.create.useMutation({ onSuccess: () => { utils.bots.list.invalidate(); toast.success("Bot created"); } });
  const updateBot = trpc.bots.update.useMutation({ onSuccess: () => { utils.bots.list.invalidate(); toast.success("Bot updated"); } });
  const deleteBot = trpc.bots.delete.useMutation({ onSuccess: () => { utils.bots.list.invalidate(); toast.success("Bot deleted"); } });

  const [createOpen, setCreateOpen] = useState(false);
  const [editBot, setEditBot] = useState<any>(null);
  const [form, setForm] = useState({ name: "", clientName: "", flowiseApiUrl: "", flowiseApiKey: "", firstMessage: "", brandLogoUrl: "" });

  const resetForm = () => setForm({ name: "", clientName: "", flowiseApiUrl: "", flowiseApiKey: "", firstMessage: "", brandLogoUrl: "" });

  const handleCreate = () => {
    if (!form.name || !form.clientName || !form.flowiseApiUrl) { toast.error("Name, client name, and Flowise API URL are required"); return; }
    createBot.mutate({ name: form.name, clientName: form.clientName, flowiseApiUrl: form.flowiseApiUrl, flowiseApiKey: form.flowiseApiKey || undefined, firstMessage: form.firstMessage || undefined, brandLogoUrl: form.brandLogoUrl || undefined });
    setCreateOpen(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editBot) return;
    updateBot.mutate({ id: editBot.id, name: form.name, clientName: form.clientName, flowiseApiUrl: form.flowiseApiUrl, flowiseApiKey: form.flowiseApiKey || undefined, firstMessage: form.firstMessage || undefined, brandLogoUrl: form.brandLogoUrl || undefined });
    setEditBot(null);
    resetForm();
  };

  const openEdit = (bot: any) => {
    setEditBot(bot);
    setForm({ name: bot.name, clientName: bot.clientName, flowiseApiUrl: bot.flowiseApiUrl, flowiseApiKey: bot.flowiseApiKey || "", firstMessage: bot.firstMessage || "", brandLogoUrl: bot.brandLogoUrl || "" });
  };

  const statusColor = (s: string) => s === "active" ? "bg-green-100 text-green-700" : s === "paused" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600";

  const BotForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><Label>Bot Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My AI Bot" /></div>
        <div><Label>Client Name *</Label><Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Client Company" /></div>
      </div>
      <div><Label>Flowise API URL *</Label><Input value={form.flowiseApiUrl} onChange={(e) => setForm({ ...form, flowiseApiUrl: e.target.value })} placeholder="https://your-flowise.com/api/v1/prediction/..." /></div>
      <div><Label>Flowise API Key (optional)</Label><Input value={form.flowiseApiKey} onChange={(e) => setForm({ ...form, flowiseApiKey: e.target.value })} placeholder="Bearer token" type="password" /></div>
      <div><Label>Brand Logo URL (optional)</Label><Input value={form.brandLogoUrl} onChange={(e) => setForm({ ...form, brandLogoUrl: e.target.value })} placeholder="https://..." /></div>
      <div><Label>First Message (optional)</Label><Textarea value={form.firstMessage} onChange={(e) => setForm({ ...form, firstMessage: e.target.value })} placeholder="Hello! How can I help you today?" rows={2} /></div>
      <DialogFooter>
        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
        <Button onClick={onSubmit} disabled={createBot.isPending || updateBot.isPending}>{submitLabel}</Button>
      </DialogFooter>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bots</h1>
          <p className="text-muted-foreground mt-1">Manage your AI bots and their Flowise configurations</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Create Bot</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create New Bot</DialogTitle></DialogHeader>
            <BotForm onSubmit={handleCreate} submitLabel="Create Bot" />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <Card key={i} className="animate-pulse"><CardContent className="h-32" /></Card>)}
        </div>
      ) : !bots?.length ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No bots yet</h3>
          <p className="text-muted-foreground mt-1">Create your first bot to get started</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bots.map((bot) => (
            <Card key={bot.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {bot.brandLogoUrl ? (
                    <img src={bot.brandLogoUrl} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{bot.name}</CardTitle>
                    <p className="text-sm text-muted-foreground truncate">{bot.clientName}</p>
                  </div>
                </div>
                <Badge className={`${statusColor(bot.status)} shrink-0`}>{bot.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{bot.flowiseApiUrl}</span>
                </div>
                <div className="flex gap-2">
                  <Dialog open={editBot?.id === bot.id} onOpenChange={(o) => { if (!o) { setEditBot(null); resetForm(); } }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => openEdit(bot)}>
                        <Pencil className="h-3 w-3 mr-1" />Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader><DialogTitle>Edit Bot</DialogTitle></DialogHeader>
                      <BotForm onSubmit={handleUpdate} submitLabel="Save Changes" />
                    </DialogContent>
                  </Dialog>
                  <Select value={bot.status} onValueChange={(v) => updateBot.mutate({ id: bot.id, status: v as any })}>
                    <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => { if (confirm("Delete this bot?")) deleteBot.mutate({ id: bot.id }); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
