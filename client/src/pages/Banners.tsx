import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Trash2, Megaphone, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function BannersPage() {
  const utils = trpc.useUtils();
  const { data: banners, isLoading } = trpc.banners.list.useQuery();
  const { data: bots } = trpc.bots.list.useQuery();
  const createBanner = trpc.banners.create.useMutation({ onSuccess: () => { utils.banners.list.invalidate(); toast.success("تم إنشاء البانر"); } });
  const updateBanner = trpc.banners.update.useMutation({ onSuccess: () => { utils.banners.list.invalidate(); toast.success("تم تحديث البانر"); } });
  const deleteBanner = trpc.banners.delete.useMutation({ onSuccess: () => { utils.banners.list.invalidate(); toast.success("تم حذف البانر"); } });

  const [createOpen, setCreateOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<any>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formBotId, setFormBotId] = useState<string>("all");

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormBotId("all");
  };

  const handleCreate = () => {
    if (!formTitle || !formContent) { toast.error("العنوان والمحتوى مطلوبان"); return; }
    createBanner.mutate({
      title: formTitle,
      content: formContent,
      botId: formBotId === "all" ? null : parseInt(formBotId),
    });
    setCreateOpen(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editBanner) return;
    updateBanner.mutate({
      id: editBanner.id,
      title: formTitle,
      content: formContent,
      botId: formBotId === "all" ? null : parseInt(formBotId),
    });
    setEditBanner(null);
    resetForm();
  };

  const openEdit = (banner: any) => {
    setEditBanner(banner);
    setFormTitle(banner.title);
    setFormContent(banner.content);
    setFormBotId(banner.botId ? banner.botId.toString() : "all");
  };

  const getBotName = (botId: number | null) => {
    if (!botId) return "جميع البوتات";
    return bots?.find(b => b.id === botId)?.name || "غير معروف";
  };

  const BannerForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4" dir="rtl">
      <div>
        <Label>العنوان *</Label>
        <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="عنوان البانر" />
      </div>
      <div>
        <Label>المحتوى *</Label>
        <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="محتوى البانر الذي سيظهر للعملاء..." rows={3} />
      </div>
      <div>
        <Label>تطبيق على</Label>
        <Select value={formBotId} onValueChange={setFormBotId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع البوتات (عام)</SelectItem>
            {bots?.map(bot => (
              <SelectItem key={bot.id} value={bot.id.toString()}>{bot.name} ({bot.clientName})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
        <Button onClick={onSubmit} disabled={createBanner.isPending || updateBanner.isPending}>{submitLabel}</Button>
      </DialogFooter>
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">البانرات</h1>
          <p className="text-muted-foreground mt-1">إدارة الإعلانات والرسائل التي تظهر للعملاء في نافذة المحادثة</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 ml-2" />إنشاء بانر</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إنشاء بانر جديد</DialogTitle></DialogHeader>
            <BannerForm onSubmit={handleCreate} submitLabel="إنشاء" />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <Card key={i} className="animate-pulse"><CardContent className="h-32" /></Card>)}
        </div>
      ) : !banners?.length ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">لا توجد بانرات بعد</h3>
          <p className="text-muted-foreground mt-1">أنشئ بانرات لعرض رسائل وإعلانات للعملاء</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((banner) => (
            <Card key={banner.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Megaphone className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{banner.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{getBotName(banner.botId)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={banner.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                    {banner.isActive ? "مفعّل" : "معطّل"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{banner.content}</p>
                <div className="flex gap-2 flex-wrap items-center">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">مفعّل</Label>
                    <Switch
                      checked={banner.isActive}
                      onCheckedChange={(checked) => updateBanner.mutate({ id: banner.id, isActive: checked })}
                    />
                  </div>
                  <Dialog open={editBanner?.id === banner.id} onOpenChange={(o) => { if (!o) { setEditBanner(null); resetForm(); } }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => openEdit(banner)}>
                        <Pencil className="h-3 w-3 ml-1" />تعديل
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>تعديل البانر</DialogTitle></DialogHeader>
                      <BannerForm onSubmit={handleUpdate} submitLabel="حفظ التغييرات" />
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => { if (confirm("هل تريد حذف هذا البانر؟")) deleteBanner.mutate({ id: banner.id }); }}>
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
