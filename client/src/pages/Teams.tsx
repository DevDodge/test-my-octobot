import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, UsersRound, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TeamsPage() {
  const utils = trpc.useUtils();
  const { data: teams, isLoading } = trpc.teams.list.useQuery();
  const createTeam = trpc.teams.create.useMutation({ onSuccess: () => { utils.teams.list.invalidate(); toast.success("تم إنشاء الفريق"); } });
  const deleteTeam = trpc.teams.delete.useMutation({ onSuccess: () => { utils.teams.list.invalidate(); toast.success("تم حذف الفريق"); } });
  const addMember = trpc.teams.members.add.useMutation({ onSuccess: () => { utils.teams.list.invalidate(); setExpandedTeam(null); toast.success("تمت إضافة العضو"); } });
  const removeMember = trpc.teams.members.remove.useMutation({ onSuccess: () => { utils.teams.list.invalidate(); toast.success("تمت إزالة العضو"); } });

  const [createOpen, setCreateOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [memberName, setMemberName] = useState("");

  const handleCreate = () => {
    if (!teamName) { toast.error("اسم الفريق مطلوب"); return; }
    createTeam.mutate({ name: teamName });
    setCreateOpen(false);
    setTeamName("");
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الفرق</h1>
          <p className="text-muted-foreground mt-1">تنظيم المختبرين في فرق عمل</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 ml-2" />إنشاء فريق</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إنشاء فريق جديد</DialogTitle></DialogHeader>
            <div className="space-y-4" dir="rtl">
              <div><Label>اسم الفريق</Label><Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="فريق ضمان الجودة" /></div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                <Button onClick={handleCreate} disabled={createTeam.isPending}>إنشاء</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <Card key={i} className="animate-pulse"><CardContent className="h-32" /></Card>)}
        </div>
      ) : !teams?.length ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <UsersRound className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">لا توجد فرق بعد</h3>
          <p className="text-muted-foreground mt-1">أنشئ فرقاً لتنظيم سير عمل الاختبار</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              isExpanded={expandedTeam === team.id}
              onToggle={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
              memberName={memberName}
              setMemberName={setMemberName}
              onAddMember={() => {
                if (!memberName) return;
                addMember.mutate({ teamId: team.id, memberName });
                setMemberName("");
              }}
              onRemoveMember={(id: number) => removeMember.mutate({ id })}
              onDelete={() => { if (confirm("هل تريد حذف هذا الفريق وجميع أعضائه؟")) deleteTeam.mutate({ id: team.id }); }}
              addingMember={addMember.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({ team, isExpanded, onToggle, memberName, setMemberName, onAddMember, onRemoveMember, onDelete, addingMember }: any) {
  const { data: members } = trpc.teams.members.list.useQuery({ teamId: team.id });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UsersRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{team.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{members?.length || 0} أعضاء</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <UserPlus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {members && members.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {members.map((m: any) => (
              <Badge key={m.id} variant="secondary" className="gap-1 pl-1">
                {m.memberName}
                <button onClick={() => onRemoveMember(m.id)} className="mr-1 hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        {isExpanded && (
          <div className="flex gap-2 pt-2">
            <Input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="اسم العضو" className="flex-1" onKeyDown={(e) => e.key === "Enter" && onAddMember()} />
            <Button size="sm" onClick={onAddMember} disabled={addingMember}>إضافة</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
