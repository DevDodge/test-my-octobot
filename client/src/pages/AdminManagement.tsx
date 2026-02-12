import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Key } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminManagementPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const adminsQuery = trpc.admins.list.useQuery();
  const createAdmin = trpc.admins.create.useMutation({
    onSuccess: () => {
      utils.admins.list.invalidate();
      toast.success("تم إضافة المسؤول بنجاح");
      setNewAdminOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ");
    },
  });
  const deleteAdmin = trpc.admins.delete.useMutation({
    onSuccess: () => {
      utils.admins.list.invalidate();
      toast.success("تم حذف المسؤول بنجاح");
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ");
    },
  });
  const updatePassword = trpc.admins.updatePassword.useMutation({
    onSuccess: () => {
      utils.admins.list.invalidate();
      toast.success("تم تحديث كلمة المرور بنجاح");
      setPasswordDialogOpen(false);
      setSelectedAdminId(null);
      setNewAdminPassword("");
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ");
    },
  });

  const [newAdminOpen, setNewAdminOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState("");

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    createAdmin.mutate({ name: newName, email: newEmail, password: newPassword });
  };

  const handleDeleteAdmin = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المسؤول؟")) {
      deleteAdmin.mutate({ id });
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAdminId === null) return;
    updatePassword.mutate({ id: selectedAdminId, password: newAdminPassword });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">إدارة المسؤولين</h1>
          <p className="text-muted-foreground text-sm mt-1">
            إضافة وإدارة حسابات المسؤولين الذين يمكنهم الوصول إلى لوحة التحكم.
          </p>
        </div>
        <Dialog open={newAdminOpen} onOpenChange={setNewAdminOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة مسؤول
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة مسؤول جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name">الاسم</Label>
                <Input
                  id="admin-name"
                  placeholder="اسم المسؤول"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">البريد الإلكتروني</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">كلمة المرور</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="كلمة مرور قوية (6 أحرف على الأقل)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">إلغاء</Button>
                </DialogClose>
                <Button type="submit" disabled={createAdmin.isPending}>
                  {createAdmin.isPending ? "جارٍ الإضافة..." : "إضافة"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تغيير كلمة المرور</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="كلمة مرور جديدة (6 أحرف على الأقل)"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                required
                minLength={6}
                dir="ltr"
                className="text-left"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">إلغاء</Button>
              </DialogClose>
              <Button type="submit" disabled={updatePassword.isPending}>
                {updatePassword.isPending ? "جارٍ التحديث..." : "تحديث"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">البريد الإلكتروني</TableHead>
              <TableHead className="text-right">الدور</TableHead>
              <TableHead className="text-right">آخر تسجيل دخول</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminsQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  جارٍ التحميل...
                </TableCell>
              </TableRow>
            ) : adminsQuery.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  لا يوجد مسؤولون
                </TableCell>
              </TableRow>
            ) : (
              adminsQuery.data?.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name || "-"}</TableCell>
                  <TableCell dir="ltr" className="text-left">{admin.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="default">مسؤول</Badge>
                  </TableCell>
                  <TableCell>
                    {admin.lastSignedIn
                      ? new Date(admin.lastSignedIn).toLocaleDateString("ar-EG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedAdminId(admin.id);
                          setNewAdminPassword("");
                          setPasswordDialogOpen(true);
                        }}
                        title="تغيير كلمة المرور"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      {admin.id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="text-destructive hover:text-destructive"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
