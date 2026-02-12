import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Bot, ExternalLink, Copy, UserPlus, Link2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function BotsPage() {
  const utils = trpc.useUtils();
  const { data: bots, isLoading } = trpc.bots.list.useQuery();
  const { data: testers } = trpc.testers.list.useQuery();
  const createBot = trpc.bots.create.useMutation({ onSuccess: () => { utils.bots.list.invalidate(); } });
  const updateBot = trpc.bots.update.useMutation({ onSuccess: () => { utils.bots.list.invalidate(); toast.success("Bot updated"); } });
  const deleteBot = trpc.bots.delete.useMutation({ onSuccess: () => { utils.bots.list.invalidate(); toast.success("Bot deleted"); } });
  const createTester = trpc.testers.create.useMutation({
    onSuccess: (data) => {
      utils.testers.list.invalidate();
      const link = `${window.location.origin}/chat/${data.shareToken}`;
      setNewTestLink(link);
      navigator.clipboard.writeText(link);
      toast.success("Tester created! Test link copied to clipboard.");
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editBot, setEditBot] = useState<any>(null);
  const [form, setForm] = useState({ name: "", clientName: "", flowiseApiUrl: "", flowiseApiKey: "", firstMessage: "", brandLogoUrl: "" });

  // Quick tester creation
  const [quickTesterModal, setQuickTesterModal] = useState<{ botId: number; botName: string } | null>(null);
  const [testerForm, setTesterForm] = useState({ name: "", email: "" });
  const [newTestLink, setNewTestLink] = useState<string | null>(null);

  // Post-creation link display
  const [createdBotLink, setCreatedBotLink] = useState<{ botId: number; botName: string } | null>(null);

  const resetForm = () => setForm({ name: "", clientName: "", flowiseApiUrl: "", flowiseApiKey: "", firstMessage: "", brandLogoUrl: "" });

  const handleCreate = () => {
    if (!form.name || !form.clientName || !form.flowiseApiUrl) { toast.error("Name, client name, and Flowise API URL are required"); return; }
    createBot.mutate({ name: form.name, clientName: form.clientName, flowiseApiUrl: form.flowiseApiUrl, flowiseApiKey: form.flowiseApiKey || undefined, firstMessage: form.firstMessage || undefined, brandLogoUrl: form.brandLogoUrl || undefined }, {
      onSuccess: (data) => {
        toast.success("Bot created successfully!");
        setCreateOpen(false);
        setCreatedBotLink({ botId: data.id, botName: form.name });
        resetForm();
      }
    });
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

  const handleQuickTester = () => {
    if (!quickTesterModal || !testerForm.name) { toast.error("Tester name is required"); return; }
    createTester.mutate({ name: testerForm.name, email: testerForm.email || undefined, botId: quickTesterModal.botId });
  };

  const getTestersForBot = (botId: number) => testers?.filter(t => t.botId === botId) || [];

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

      {/* Post-creation: Generate Test Link */}
      <Dialog open={!!createdBotLink} onOpenChange={(o) => { if (!o) { setCreatedBotLink(null); setNewTestLink(null); setTesterForm({ name: "", email: "" }); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Bot Created Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Now create a tester to generate a shareable test link for <strong>{createdBotLink?.botName}</strong>:
            </p>
            <div className="space-y-3">
              <div><Label>Tester Name *</Label><Input value={testerForm.name} onChange={(e) => setTesterForm({ ...testerForm, name: e.target.value })} placeholder="Client name" /></div>
              <div><Label>Email (optional)</Label><Input value={testerForm.email} onChange={(e) => setTesterForm({ ...testerForm, email: e.target.value })} placeholder="email@example.com" type="email" /></div>
            </div>

            {newTestLink && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 space-y-2">
                <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                  <Link2 className="h-4 w-4" />
                  Test Link Generated!
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white p-2 rounded border truncate">{newTestLink}</code>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(newTestLink); toast.success("Link copied!"); }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <a href={newTestLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />Open Test Chat
                  </a>
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            {!newTestLink ? (
              <>
                <DialogClose asChild><Button variant="outline">Skip</Button></DialogClose>
                <Button onClick={() => {
                  if (!testerForm.name || !createdBotLink) { toast.error("Tester name is required"); return; }
                  createTester.mutate({ name: testerForm.name, email: testerForm.email || undefined, botId: createdBotLink.botId });
                }} disabled={createTester.isPending}>
                  Generate Test Link
                </Button>
              </>
            ) : (
              <DialogClose asChild><Button>Done</Button></DialogClose>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          {bots.map((bot) => {
            const botTesters = getTestersForBot(bot.id);
            return (
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

                  {/* Show existing test links */}
                  {botTesters.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium text-muted-foreground">Test Links ({botTesters.length})</div>
                      {botTesters.slice(0, 3).map((tester) => (
                        <div key={tester.id} className="flex items-center gap-2 text-xs">
                          <span className="truncate text-muted-foreground">{tester.name}</span>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={() => {
                              const link = `${window.location.origin}/chat/${tester.shareToken}`;
                              navigator.clipboard.writeText(link);
                              toast.success("Link copied!");
                            }}>
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 px-1.5" asChild>
                              <a href={`/chat/${tester.shareToken}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                      {botTesters.length > 3 && (
                        <p className="text-xs text-muted-foreground">+{botTesters.length - 3} more</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => { setQuickTesterModal({ botId: bot.id, botName: bot.name }); setTesterForm({ name: "", email: "" }); setNewTestLink(null); }}>
                      <UserPlus className="h-3 w-3 mr-1" />New Test Link
                    </Button>
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
            );
          })}
        </div>
      )}

      {/* Quick Tester Modal */}
      <Dialog open={!!quickTesterModal} onOpenChange={(o) => { if (!o) { setQuickTesterModal(null); setNewTestLink(null); setTesterForm({ name: "", email: "" }); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Generate Test Link - {quickTesterModal?.botName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div><Label>Tester Name *</Label><Input value={testerForm.name} onChange={(e) => setTesterForm({ ...testerForm, name: e.target.value })} placeholder="Client name" /></div>
              <div><Label>Email (optional)</Label><Input value={testerForm.email} onChange={(e) => setTesterForm({ ...testerForm, email: e.target.value })} placeholder="email@example.com" type="email" /></div>
            </div>

            {newTestLink && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 space-y-2">
                <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                  <Link2 className="h-4 w-4" />
                  Test Link Generated!
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white p-2 rounded border truncate">{newTestLink}</code>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(newTestLink); toast.success("Link copied!"); }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <a href={newTestLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />Open Test Chat
                  </a>
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            {!newTestLink ? (
              <>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleQuickTester} disabled={createTester.isPending}>
                  Generate Test Link
                </Button>
              </>
            ) : (
              <DialogClose asChild><Button>Done</Button></DialogClose>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
