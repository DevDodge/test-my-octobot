import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Copy, Users, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TestersPage() {
  const utils = trpc.useUtils();
  const { data: testers, isLoading } = trpc.testers.list.useQuery();
  const { data: bots } = trpc.bots.list.useQuery();
  const createTester = trpc.testers.create.useMutation({
    onSuccess: (data) => {
      utils.testers.list.invalidate();
      const link = `${window.location.origin}/chat/${data.shareToken}`;
      navigator.clipboard.writeText(link);
      toast.success("تم إنشاء المختبر! تم نسخ رابط المشاركة.");
    },
  });
  const deleteTester = trpc.testers.delete.useMutation({ onSuccess: () => { utils.testers.list.invalidate(); toast.success("تمت إزالة المختبر"); } });

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", botId: "" });

  const handleCreate = () => {
    if (!form.name || !form.botId) { toast.error("الاسم والبوت مطلوبان"); return; }
    createTester.mutate({ name: form.name, email: form.email || undefined, botId: parseInt(form.botId) });
    setCreateOpen(false);
    setForm({ name: "", email: "", botId: "" });
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/chat/${token}`);
    toast.success("تم نسخ رابط المشاركة!");
  };

  const getBotName = (botId: number) => bots?.find((b) => b.id === botId)?.name || "غير معروف";

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">المختبرون</h1>
          <p className="text-muted-foreground mt-1">إدارة المختبرين وتعيينهم للبوتات</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 ml-2" />إضافة مختبر</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إضافة مختبر جديد</DialogTitle></DialogHeader>
            <div className="space-y-4" dir="rtl">
              <div><Label>الاسم *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم المختبر" /></div>
              <div><Label>البريد الإلكتروني (اختياري)</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" type="email" dir="ltr" /></div>
              <div>
                <Label>تعيين البوت *</Label>
                <Select value={form.botId} onValueChange={(v) => setForm({ ...form, botId: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر بوت" /></SelectTrigger>
                  <SelectContent>
                    {bots?.filter(b => b.status === "live" || b.status === "testing").map((bot) => (
                      <SelectItem key={bot.id} value={bot.id.toString()}>{bot.name} ({bot.clientName})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                <Button onClick={handleCreate} disabled={createTester.isPending}>إضافة المختبر</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card><CardContent className="h-48 animate-pulse" /></Card>
      ) : !testers?.length ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">لا يوجد مختبرون بعد</h3>
          <p className="text-muted-foreground mt-1">أضف مختبرين وعيّنهم للبوتات</p>
        </CardContent></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead className="hidden sm:table-cell">البريد الإلكتروني</TableHead>
                  <TableHead>البوت</TableHead>
                  <TableHead>رابط المشاركة</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testers.map((tester) => (
                  <TableRow key={tester.id}>
                    <TableCell className="font-medium">{tester.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{tester.email || "-"}</TableCell>
                    <TableCell>{getBotName(tester.botId)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => copyLink(tester.shareToken)} title="نسخ رابط المشاركة">
                          <Copy className="h-3 w-3 ml-1" />نسخ
                        </Button>
                        <Button variant="ghost" size="sm" asChild title="فتح المحادثة">
                          <a href={`/chat/${tester.shareToken}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("هل تريد إزالة هذا المختبر؟")) deleteTester.mutate({ id: tester.id }); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
