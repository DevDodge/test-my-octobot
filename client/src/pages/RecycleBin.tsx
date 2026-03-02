import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, RotateCcw, AlertTriangle, Recycle, Users, Bot } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Tab = "testers" | "bots";

export default function RecycleBinPage() {
    const utils = trpc.useUtils();
    const [activeTab, setActiveTab] = useState<Tab>("testers");

    // ── Testers ──
    const { data: deletedTesters, isLoading: loadingTesters } = trpc.testers.listDeleted.useQuery();
    const restoreTester = trpc.testers.restore.useMutation({
        onSuccess: () => {
            utils.testers.listDeleted.invalidate();
            utils.testers.list.invalidate();
            toast.success("تم استعادة رابط الاختبار بنجاح");
        },
    });
    const permanentDeleteTester = trpc.testers.permanentDelete.useMutation({
        onSuccess: () => {
            utils.testers.listDeleted.invalidate();
            setDeleteConfirm(null);
            toast.success("تم الحذف النهائي بنجاح");
        },
    });

    // ── Bots ──
    const { data: deletedBots, isLoading: loadingBots } = trpc.bots.listDeleted.useQuery();
    const restoreBot = trpc.bots.restore.useMutation({
        onSuccess: () => {
            utils.bots.listDeleted.invalidate();
            utils.bots.list.invalidate();
            toast.success("تم استعادة البوت بنجاح");
        },
    });
    const permanentDeleteBot = trpc.bots.permanentDelete.useMutation({
        onSuccess: () => {
            utils.bots.listDeleted.invalidate();
            setDeleteConfirm(null);
            toast.success("تم الحذف النهائي بنجاح");
        },
    });

    const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string; type: Tab } | null>(null);

    const isLoading = activeTab === "testers" ? loadingTesters : loadingBots;

    const statusLabel = (s: string) => {
        switch (s) {
            case "in_review": return "قيد المراجعة";
            case "testing": return "تجريبي";
            case "live": return "مباشر";
            case "not_live": return "غير مباشر";
            case "cancelled": return "ملغى";
            default: return s;
        }
    };
    const statusColor = (s: string) => {
        switch (s) {
            case "live": return "bg-green-100 text-green-700";
            case "testing": return "bg-blue-100 text-blue-700";
            case "in_review": return "bg-yellow-100 text-yellow-700";
            case "not_live": return "bg-gray-100 text-gray-600";
            case "cancelled": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    const handlePermanentDelete = () => {
        if (!deleteConfirm) return;
        if (deleteConfirm.type === "testers") {
            permanentDeleteTester.mutate({ id: deleteConfirm.id });
        } else {
            permanentDeleteBot.mutate({ id: deleteConfirm.id });
        }
    };

    const testerCount = deletedTesters?.length || 0;
    const botCount = deletedBots?.length || 0;

    return (
        <div className="space-y-6" dir="rtl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">سلة المحذوفات</h1>
                <p className="text-muted-foreground mt-1">العناصر المحذوفة — يمكنك استعادتها أو حذفها نهائياً</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab("testers")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "testers"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Users className="h-4 w-4" />
                    روابط الاختبار
                    {testerCount > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{testerCount}</Badge>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("bots")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "bots"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Bot className="h-4 w-4" />
                    البوتات
                    {botCount > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{botCount}</Badge>
                    )}
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <Card><CardContent className="h-48 animate-pulse" /></Card>
            ) : activeTab === "testers" ? (
                /* ── Testers Table ── */
                !deletedTesters?.length ? (
                    <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Recycle className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">لا توجد روابط محذوفة</h3>
                        <p className="text-muted-foreground mt-1">سلة روابط الاختبار فارغة</p>
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
                                        <TableHead className="hidden md:table-cell">العميل</TableHead>
                                        <TableHead>تاريخ الحذف</TableHead>
                                        <TableHead className="w-28">إجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deletedTesters.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="hidden sm:table-cell text-muted-foreground">{item.email || "-"}</TableCell>
                                            <TableCell>{item.botName || "غير معروف"}</TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground">{item.clientName || "-"}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }) : "-"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                        onClick={() => restoreTester.mutate({ id: item.id })}
                                                        disabled={restoreTester.isPending}
                                                        title="استعادة"
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5 ml-1" />
                                                        استعادة
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => setDeleteConfirm({ id: item.id, name: item.name, type: "testers" })}
                                                        title="حذف نهائي"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                )
            ) : (
                /* ── Bots Table ── */
                !deletedBots?.length ? (
                    <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Recycle className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">لا توجد بوتات محذوفة</h3>
                        <p className="text-muted-foreground mt-1">سلة البوتات فارغة</p>
                    </CardContent></Card>
                ) : (
                    <Card>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>اسم البوت</TableHead>
                                        <TableHead>العميل</TableHead>
                                        <TableHead>الحالة</TableHead>
                                        <TableHead className="hidden md:table-cell">API URL</TableHead>
                                        <TableHead>تاريخ الحذف</TableHead>
                                        <TableHead className="w-28">إجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deletedBots.map((bot) => (
                                        <TableRow key={bot.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {bot.brandLogoUrl && (
                                                        <img src={bot.brandLogoUrl} alt="" className="h-6 w-6 rounded object-cover" />
                                                    )}
                                                    {bot.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{bot.clientName}</TableCell>
                                            <TableCell>
                                                <Badge className={statusColor(bot.status)}>{statusLabel(bot.status)}</Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground text-xs max-w-[200px] truncate" title={bot.flowiseApiUrl}>
                                                {bot.flowiseApiUrl}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {bot.deletedAt ? new Date(bot.deletedAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }) : "-"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                        onClick={() => restoreBot.mutate({ id: bot.id })}
                                                        disabled={restoreBot.isPending}
                                                        title="استعادة"
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5 ml-1" />
                                                        استعادة
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => setDeleteConfirm({ id: bot.id, name: bot.name, type: "bots" })}
                                                        title="حذف نهائي"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                )
            )}

            {/* Permanent Delete Confirmation */}
            <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            حذف نهائي
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3" dir="rtl">
                        <p className="text-sm text-muted-foreground">
                            هل أنت متأكد من الحذف النهائي لـ <strong>{deleteConfirm?.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
                        </p>
                        {deleteConfirm?.type === "bots" && (
                            <p className="text-xs text-destructive/80">
                                ⚠️ سيتم حذف جميع الجلسات والرسائل والتقييمات المرتبطة بهذا البوت نهائياً.
                            </p>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <Button variant="outline">إلغاء</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handlePermanentDelete}
                            disabled={permanentDeleteTester.isPending || permanentDeleteBot.isPending}
                        >
                            <Trash2 className="h-4 w-4 ml-1" />
                            {(permanentDeleteTester.isPending || permanentDeleteBot.isPending) ? "جاري الحذف..." : "حذف نهائي"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
