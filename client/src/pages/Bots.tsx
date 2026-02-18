import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Bot, ExternalLink, Copy, UserPlus, Link2, CheckCircle2, ClipboardList, Upload, Users, MessageCircle, RefreshCcw, AlertTriangle } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const BOT_STATUSES = [
  { value: "in_review", label: "قيد المراجعة", color: "bg-amber-100 text-amber-700" },
  { value: "testing", label: "قيد الاختبار", color: "bg-blue-100 text-blue-700" },
  { value: "live", label: "مباشر", color: "bg-green-100 text-green-700" },
  { value: "not_live", label: "غير مباشر", color: "bg-gray-100 text-gray-600" },
  { value: "cancelled", label: "ملغي", color: "bg-red-100 text-red-700" },
] as const;

// Map old status values to new ones for display
const OLD_STATUS_MAP: Record<string, string> = {
  active: "live",
  paused: "not_live",
  archived: "cancelled",
};

function getStatusInfo(status: string) {
  const mappedStatus = OLD_STATUS_MAP[status] || status;
  return BOT_STATUSES.find(s => s.value === mappedStatus) || { value: status, label: status, color: "bg-gray-100 text-gray-600" };
}

export default function BotsPage() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const { data: bots, isLoading } = trpc.bots.list.useQuery();
  const { data: testers } = trpc.testers.list.useQuery();
  const { data: sessions } = trpc.sessions.list.useQuery(undefined, { refetchInterval: 15000 });
  const { data: messageCounts } = trpc.sessions.messageCounts.useQuery(undefined, { refetchInterval: 15000 });
  const createBot = trpc.bots.create.useMutation({ onSuccess: () => { utils.bots.list.invalidate(); } });
  const updateBot = trpc.bots.update.useMutation({ onSuccess: () => { utils.bots.list.invalidate(); toast.success("تم تحديث البوت"); } });
  const deleteBot = trpc.bots.delete.useMutation({ onSuccess: () => { utils.bots.list.invalidate(); toast.success("تم حذف البوت"); } });
  const uploadImage = trpc.upload.image.useMutation();
  const createTester = trpc.testers.create.useMutation({
    onSuccess: (data) => {
      utils.testers.list.invalidate();
      const link = `${window.location.origin}/chat/${data.shareToken}`;
      setNewTestLink(link);
      navigator.clipboard.writeText(link);
      toast.success("تم إنشاء المختبر! تم نسخ رابط الاختبار.");
    },
  });
  const deleteTester = trpc.testers.delete.useMutation({
    onSuccess: () => {
      utils.testers.list.invalidate();
      utils.sessions.list.invalidate();
      utils.sessions.messageCounts.invalidate();
      setDeleteTesterModal(null);
      toast.success("تم حذف رابط الاختبار بنجاح");
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editBot, setEditBot] = useState<any>(null);

  const [formName, setFormName] = useState("");
  const [formClientName, setFormClientName] = useState("");
  const [formFlowiseApiUrl, setFormFlowiseApiUrl] = useState("");
  const [formFirstMessage, setFormFirstMessage] = useState("");
  const [formBrandLogoUrl, setFormBrandLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Quick tester creation
  const [quickTesterModal, setQuickTesterModal] = useState<{ botId: number; botName: string } | null>(null);
  const [testerName, setTesterName] = useState("");
  const [testerEmail, setTesterEmail] = useState("");
  const [newTestLink, setNewTestLink] = useState<string | null>(null);
  const [deleteTesterModal, setDeleteTesterModal] = useState<{ tester: any; sessions: any[]; totalMessages: number } | null>(null);

  // Post-creation link display
  const [createdBotLink, setCreatedBotLink] = useState<{ botId: number; botName: string } | null>(null);

  const resetForm = () => {
    setFormName("");
    setFormClientName("");
    setFormFlowiseApiUrl("");
    setFormFirstMessage("");
    setFormBrandLogoUrl("");
  };

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }
    setUploadingLogo(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      const result = await uploadImage.mutateAsync({
        base64,
        filename: file.name,
        contentType: file.type,
      });
      setFormBrandLogoUrl(result.url);
      toast.success("تم رفع الشعار بنجاح");
    } catch (err) {
      console.error("Logo upload failed:", err);
      toast.error("فشل رفع الشعار");
    } finally {
      setUploadingLogo(false);
      // Reset the file input so the same file can be selected again
      e.target.value = "";
    }
  }, [uploadImage]);

  const handleCreate = () => {
    if (!formName || !formClientName || !formFlowiseApiUrl) {
      toast.error("الاسم واسم العميل ورابط API مطلوبة");
      return;
    }
    createBot.mutate({
      name: formName,
      clientName: formClientName,
      flowiseApiUrl: formFlowiseApiUrl,
      firstMessage: formFirstMessage || undefined,
      brandLogoUrl: formBrandLogoUrl || undefined,
    }, {
      onSuccess: (data) => {
        toast.success("تم إنشاء البوت بنجاح!");
        setCreateOpen(false);
        setCreatedBotLink({ botId: data.id, botName: formName });
        resetForm();
      }
    });
  };

  const handleUpdate = () => {
    if (!editBot) return;
    updateBot.mutate({
      id: editBot.id,
      name: formName,
      clientName: formClientName,
      flowiseApiUrl: formFlowiseApiUrl,
      firstMessage: formFirstMessage || undefined,
      brandLogoUrl: formBrandLogoUrl || undefined,
    });
    setEditBot(null);
    resetForm();
  };

  const openEdit = (bot: any) => {
    setEditBot(bot);
    setFormName(bot.name);
    setFormClientName(bot.clientName);
    setFormFlowiseApiUrl(bot.flowiseApiUrl);
    setFormFirstMessage(bot.firstMessage || "");
    setFormBrandLogoUrl(bot.brandLogoUrl || "");
  };

  const handleQuickTester = () => {
    if (!quickTesterModal || !testerName) {
      toast.error("اسم المختبر مطلوب");
      return;
    }
    createTester.mutate({ name: testerName, email: testerEmail || undefined, botId: quickTesterModal.botId });
  };

  const getTestersForBot = (botId: number) => testers?.filter(t => t.botId === botId) || [];
  const getSessionsForTester = (testerId: number) => sessions?.filter(s => s.clientTesterId === testerId) || [];
  const getMsgCountForSession = (sessionId: number) => messageCounts?.find(mc => mc.sessionId === sessionId)?.count ?? 0;
  const isSessionOnline = (s: any) => {
    if (!s.lastSeenAt) return false;
    return (Date.now() - new Date(s.lastSeenAt).getTime()) < 60000; // within 60s
  };

  // Inline form JSX builder to avoid re-mounting on state changes
  const renderBotForm = (onSubmit: () => void, submitLabel: string, fileRef: React.RefObject<HTMLInputElement | null>) => (
    <div className="space-y-4" dir="rtl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>اسم البوت *</Label>
          <input
            className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm placeholder:text-muted-foreground"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="بوت الذكاء الاصطناعي"
          />
        </div>
        <div>
          <Label>اسم العميل *</Label>
          <input
            className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm placeholder:text-muted-foreground"
            value={formClientName}
            onChange={(e) => setFormClientName(e.target.value)}
            placeholder="اسم الشركة"
          />
        </div>
      </div>
      <div>
        <Label>رابط API *</Label>
        <input
          className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm placeholder:text-muted-foreground"
          value={formFlowiseApiUrl}
          onChange={(e) => setFormFlowiseApiUrl(e.target.value)}
          placeholder="https://your-api.com/api/v1/prediction/..."
          dir="ltr"
        />
      </div>
      <div>
        <Label>شعار العلامة التجارية (اختياري)</Label>
        <div className="flex items-center gap-3 mt-1">
          {formBrandLogoUrl && (
            <img src={formBrandLogoUrl} alt="شعار" className="h-12 w-12 rounded-lg object-cover border" />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploadingLogo}
          >
            <Upload className="h-4 w-4 ml-1" />
            {uploadingLogo ? "جاري الرفع..." : formBrandLogoUrl ? "تغيير الشعار" : "رفع شعار"}
          </Button>
          {formBrandLogoUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setFormBrandLogoUrl("")}>
              إزالة
            </Button>
          )}
        </div>
      </div>
      <div>
        <Label>الرسالة الأولى (اختياري)</Label>
        <textarea
          className="flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm placeholder:text-muted-foreground"
          value={formFirstMessage}
          onChange={(e) => setFormFirstMessage(e.target.value)}
          placeholder="مرحباً! كيف يمكنني مساعدتك اليوم؟"
          rows={2}
        />
      </div>
      <DialogFooter>
        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
        <Button onClick={onSubmit} disabled={createBot.isPending || updateBot.isPending}>{submitLabel}</Button>
      </DialogFooter>
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">البوتات</h1>
          <p className="text-muted-foreground mt-1">إدارة بوتات الذكاء الاصطناعي وإعداداتها</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 ml-2" />إنشاء بوت</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>إنشاء بوت جديد</DialogTitle></DialogHeader>
            {renderBotForm(handleCreate, "إنشاء البوت", createFileInputRef)}
          </DialogContent>
        </Dialog>
      </div>

      {/* Post-creation: Generate Test Link */}
      <Dialog open={!!createdBotLink} onOpenChange={(o) => { if (!o) { setCreatedBotLink(null); setNewTestLink(null); setTesterName(""); setTesterEmail(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              تم إنشاء البوت بنجاح!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4" dir="rtl">
            <p className="text-sm text-muted-foreground">
              الآن أنشئ مختبر لإنشاء رابط اختبار قابل للمشاركة لـ <strong>{createdBotLink?.botName}</strong>:
            </p>
            <div className="space-y-3">
              <div><Label>اسم المختبر *</Label><input className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm placeholder:text-muted-foreground" value={testerName} onChange={(e) => setTesterName(e.target.value)} placeholder="اسم العميل" /></div>
              <div><Label>البريد الإلكتروني (اختياري)</Label><input className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm placeholder:text-muted-foreground" value={testerEmail} onChange={(e) => setTesterEmail(e.target.value)} placeholder="email@example.com" type="email" dir="ltr" /></div>
            </div>

            {newTestLink && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 space-y-2">
                <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                  <Link2 className="h-4 w-4" />
                  تم إنشاء رابط الاختبار!
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white p-2 rounded border truncate" dir="ltr">{newTestLink}</code>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(newTestLink); toast.success("تم نسخ الرابط!"); }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <a href={newTestLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 ml-1" />فتح المحادثة
                  </a>
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            {!newTestLink ? (
              <>
                <DialogClose asChild><Button variant="outline">تخطي</Button></DialogClose>
                <Button onClick={() => {
                  if (!testerName || !createdBotLink) { toast.error("اسم المختبر مطلوب"); return; }
                  createTester.mutate({ name: testerName, email: testerEmail || undefined, botId: createdBotLink.botId });
                }} disabled={createTester.isPending}>
                  إنشاء رابط الاختبار
                </Button>
              </>
            ) : (
              <DialogClose asChild><Button>تم</Button></DialogClose>
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
          <h3 className="text-lg font-medium">لا توجد بوتات بعد</h3>
          <p className="text-muted-foreground mt-1">أنشئ أول بوت للبدء</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bots.map((bot) => {
            const botTesters = getTestersForBot(bot.id);
            const statusInfo = getStatusInfo(bot.status);
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
                  <Badge className={`${statusInfo.color} shrink-0`}>{statusInfo.label}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-1" dir="ltr">
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{bot.flowiseApiUrl}</span>
                  </div>

                  {/* Show existing test links */}
                  {botTesters.length > 0 && (
                    <div className="rounded-lg border border-border/60 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/60">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">روابط الاختبار</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-semibold">{botTesters.length}</Badge>
                      </div>
                      <div className="divide-y divide-border/40 max-h-[180px] overflow-y-auto">
                        {botTesters.map((tester, index) => {
                          const testerSessions = getSessionsForTester(tester.id);
                          const totalMsgCount = testerSessions.reduce((acc, s) => acc + getMsgCountForSession(s.id), 0);
                          const isOnline = testerSessions.some(s => isSessionOnline(s));
                          const hasRefreshSession = testerSessions.some(s => s.createdByRefresh);
                          return (
                            <div key={tester.id} className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/30 transition-colors group">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] text-muted-foreground/60 font-mono w-4 text-center shrink-0">{index + 1}</span>
                                <div className="h-6 w-6 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
                                  <span className="text-[10px] font-medium text-primary">{tester.name?.charAt(0)?.toUpperCase()}</span>
                                </div>
                                <span className="text-xs text-foreground/80 truncate">{tester.name}</span>
                                {testerSessions.length > 0 && (
                                  <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isOnline
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                                    : "bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400"
                                    }`}>
                                    {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                    {hasRefreshSession ? <RefreshCcw className="h-2.5 w-2.5" /> : <MessageCircle className="h-2.5 w-2.5" />}
                                    {totalMsgCount}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md hover:bg-primary/10 hover:text-primary" onClick={() => {
                                  const link = `${window.location.origin}/chat/${tester.shareToken}`;
                                  navigator.clipboard.writeText(link);
                                  toast.success("تم نسخ الرابط!");
                                }} title="نسخ الرابط">
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md hover:bg-primary/10 hover:text-primary" asChild title="فتح المحادثة">
                                  <a href={`/chat/${tester.shareToken}`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md hover:bg-destructive/10 hover:text-destructive" onClick={() => {
                                  setDeleteTesterModal({ tester, sessions: testerSessions, totalMessages: totalMsgCount });
                                }} title="حذف الرابط">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => { setQuickTesterModal({ botId: bot.id, botName: bot.name }); setTesterName(""); setTesterEmail(""); setNewTestLink(null); }}>
                      <UserPlus className="h-3 w-3 ml-1" />رابط اختبار جديد
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setLocation(`/sessions?botId=${bot.id}`)}>
                      <ClipboardList className="h-3 w-3 ml-1" />الجلسات
                    </Button>
                    <Dialog open={editBot?.id === bot.id} onOpenChange={(o) => { if (!o) { setEditBot(null); resetForm(); } }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => openEdit(bot)}>
                          <Pencil className="h-3 w-3 ml-1" />تعديل
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader><DialogTitle>تعديل البوت</DialogTitle></DialogHeader>
                        {renderBotForm(handleUpdate, "حفظ التغييرات", editFileInputRef)}
                      </DialogContent>
                    </Dialog>
                    <Select value={bot.status} onValueChange={(v) => updateBot.mutate({ id: bot.id, status: v as any })}>
                      <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BOT_STATUSES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => { if (confirm("هل تريد حذف هذا البوت؟")) deleteBot.mutate({ id: bot.id }); }}>
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
      <Dialog open={!!quickTesterModal} onOpenChange={(o) => { if (!o) { setQuickTesterModal(null); setNewTestLink(null); setTesterName(""); setTesterEmail(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              إنشاء رابط اختبار - {quickTesterModal?.botName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4" dir="rtl">
            <div className="space-y-3">
              <div><Label>اسم المختبر *</Label><input className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm placeholder:text-muted-foreground" value={testerName} onChange={(e) => setTesterName(e.target.value)} placeholder="اسم العميل" /></div>
              <div><Label>البريد الإلكتروني (اختياري)</Label><input className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm placeholder:text-muted-foreground" value={testerEmail} onChange={(e) => setTesterEmail(e.target.value)} placeholder="email@example.com" type="email" dir="ltr" /></div>
            </div>

            {newTestLink && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 space-y-2">
                <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                  <Link2 className="h-4 w-4" />
                  تم إنشاء رابط الاختبار!
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white p-2 rounded border truncate" dir="ltr">{newTestLink}</code>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(newTestLink); toast.success("تم نسخ الرابط!"); }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <a href={newTestLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 ml-1" />فتح المحادثة
                  </a>
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            {!newTestLink ? (
              <>
                <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                <Button onClick={handleQuickTester} disabled={createTester.isPending}>
                  إنشاء رابط الاختبار
                </Button>
              </>
            ) : (
              <DialogClose asChild><Button>تم</Button></DialogClose>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tester Confirmation Modal */}
      <Dialog open={!!deleteTesterModal} onOpenChange={(o) => { if (!o) setDeleteTesterModal(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              تأكيد حذف رابط الاختبار
            </DialogTitle>
          </DialogHeader>
          {deleteTesterModal && (
            <div className="space-y-4" dir="rtl">
              <p className="text-sm text-muted-foreground">
                هل أنت متأكد من حذف رابط الاختبار هذا؟ سيتم حذف جميع البيانات المرتبطة به.
              </p>
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">الاسم</span>
                  <span className="text-sm font-medium">{deleteTesterModal.tester.name}</span>
                </div>
                {deleteTesterModal.tester.email && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">البريد الإلكتروني</span>
                    <span className="text-sm font-medium" dir="ltr">{deleteTesterModal.tester.email}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">البوت</span>
                  <span className="text-sm font-medium">{bots?.find(b => b.id === deleteTesterModal.tester.botId)?.name || "غير معروف"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">رابط المشاركة</span>
                  <code className="text-[10px] bg-background px-2 py-1 rounded border max-w-[180px] truncate" dir="ltr">
                    /chat/{deleteTesterModal.tester.shareToken}
                  </code>
                </div>
                <div className="border-t border-border my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">عدد الجلسات</span>
                  <Badge variant="secondary">{deleteTesterModal.sessions.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">إجمالي الرسائل</span>
                  <Badge variant="secondary">{deleteTesterModal.totalMessages}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">تاريخ الإنشاء</span>
                  <span className="text-xs text-muted-foreground" dir="ltr">
                    {new Date(deleteTesterModal.tester.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
              </div>
              {deleteTesterModal.sessions.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20">
                  <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    تحذير: يوجد {deleteTesterModal.sessions.length} جلسة و {deleteTesterModal.totalMessages} رسالة مرتبطة بهذا الرابط.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTesterModal) {
                  deleteTester.mutate({ id: deleteTesterModal.tester.id });
                }
              }}
              disabled={deleteTester.isPending}
            >
              <Trash2 className="h-4 w-4 ml-1" />
              {deleteTester.isPending ? "جاري الحذف..." : "حذف نهائي"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
