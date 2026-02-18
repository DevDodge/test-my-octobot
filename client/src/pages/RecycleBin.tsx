import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, RotateCcw, AlertTriangle, Recycle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function RecycleBinPage() {
    const utils = trpc.useUtils();
    const { data: deletedTesters, isLoading } = trpc.testers.listDeleted.useQuery();
    const restoreTester = trpc.testers.restore.useMutation({
        onSuccess: () => {
            utils.testers.listDeleted.invalidate();
            utils.testers.list.invalidate();
            toast.success("تم استعادة رابط الاختبار بنجاح");
        },
    });
    const permanentDelete = trpc.testers.permanentDelete.useMutation({
        onSuccess: () => {
            utils.testers.listDeleted.invalidate();
            setDeleteConfirm(null);
            toast.success("تم الحذف النهائي بنجاح");
        },
    });

    const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

    return (
        <div className="space-y-6" dir="rtl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">سلة المحذوفات</h1>
                <p className="text-muted-foreground mt-1">روابط الاختبار المحذوفة — يمكنك استعادتها أو حذفها نهائياً</p>
            </div>

            {isLoading ? (
                <Card><CardContent className="h-48 animate-pulse" /></Card>
            ) : !deletedTesters?.length ? (
                <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Recycle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">السلة فارغة</h3>
                    <p className="text-muted-foreground mt-1">لا توجد روابط اختبار محذوفة</p>
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
                                                    onClick={() => setDeleteConfirm({ id: item.id, name: item.name })}
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
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <Button variant="outline">إلغاء</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() => { if (deleteConfirm) permanentDelete.mutate({ id: deleteConfirm.id }); }}
                            disabled={permanentDelete.isPending}
                        >
                            <Trash2 className="h-4 w-4 ml-1" />
                            {permanentDelete.isPending ? "جاري الحذف..." : "حذف نهائي"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
