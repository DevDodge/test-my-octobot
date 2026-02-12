import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";

export default function SessionsPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { data: sessions, isLoading } = trpc.sessions.list.useQuery();
  const { data: bots } = trpc.bots.list.useQuery();
  const { data: testers } = trpc.testers.list.useQuery();

  // Parse botId from query params
  const urlParams = new URLSearchParams(searchString);
  const initialBotFilter = urlParams.get("botId") || "all";
  const [filterBot, setFilterBot] = useState<string>(initialBotFilter);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const botId = params.get("botId");
    if (botId) setFilterBot(botId);
  }, [searchString]);

  const filteredSessions = filterBot === "all" ? sessions : sessions?.filter((s) => s.botId === parseInt(filterBot));
  const getBotName = (botId: number) => bots?.find((b) => b.id === botId)?.name || "غير معروف";
  const getTesterName = (testerId: number) => testers?.find((t) => t.id === testerId)?.name || "غير معروف";

  const statusColor = (s: string) => {
    if (s === "live") return "bg-green-100 text-green-700";
    if (s === "completed") return "bg-blue-100 text-blue-700";
    return "bg-purple-100 text-purple-700";
  };

  const statusLabel = (s: string) => {
    if (s === "live") return "مباشر";
    if (s === "completed") return "مكتمل";
    return "تمت المراجعة";
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">جلسات الاختبار</h1>
          <p className="text-muted-foreground mt-1">عرض وإدارة جميع جلسات الاختبار</p>
        </div>
        <Select value={filterBot} onValueChange={setFilterBot}>
          <SelectTrigger className="w-48"><SelectValue placeholder="تصفية حسب البوت" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع البوتات</SelectItem>
            {bots?.map((bot) => (
              <SelectItem key={bot.id} value={bot.id.toString()}>{bot.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card><CardContent className="h-48 animate-pulse" /></Card>
      ) : !filteredSessions?.length ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">لا توجد جلسات بعد</h3>
          <p className="text-muted-foreground mt-1">ستظهر الجلسات عندما يبدأ المختبرون بالمحادثة</p>
        </CardContent></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>البوت</TableHead>
                  <TableHead>المختبر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="hidden sm:table-cell">التقييم</TableHead>
                  <TableHead className="hidden sm:table-cell">تاريخ الإنشاء</TableHead>
                  <TableHead className="w-24">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{getBotName(session.botId)}</TableCell>
                    <TableCell>{getTesterName(session.clientTesterId)}</TableCell>
                    <TableCell><Badge className={statusColor(session.status)}>{statusLabel(session.status)}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {session.reviewRating ? `${session.reviewRating}/5` : "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {new Date(session.createdAt).toLocaleDateString("ar-EG")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setLocation(`/sessions/${session.id}`)} title="عرض التفاصيل">
                          <Eye className="h-3 w-3" />
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
    </div>
  );
}
