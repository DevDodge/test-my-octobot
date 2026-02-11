import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Eye, Download } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function SessionsPage() {
  const [, setLocation] = useLocation();
  const { data: sessions, isLoading } = trpc.sessions.list.useQuery();
  const { data: bots } = trpc.bots.list.useQuery();
  const { data: testers } = trpc.testers.list.useQuery();
  const [filterBot, setFilterBot] = useState<string>("all");

  const filteredSessions = filterBot === "all" ? sessions : sessions?.filter((s) => s.botId === parseInt(filterBot));
  const getBotName = (botId: number) => bots?.find((b) => b.id === botId)?.name || "Unknown";
  const getTesterName = (testerId: number) => testers?.find((t) => t.id === testerId)?.name || "Unknown";

  const statusColor = (s: string) => {
    if (s === "live") return "bg-green-100 text-green-700";
    if (s === "completed") return "bg-blue-100 text-blue-700";
    return "bg-purple-100 text-purple-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Test Sessions</h1>
          <p className="text-muted-foreground mt-1">View and manage all test sessions</p>
        </div>
        <Select value={filterBot} onValueChange={setFilterBot}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by bot" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bots</SelectItem>
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
          <h3 className="text-lg font-medium">No sessions yet</h3>
          <p className="text-muted-foreground mt-1">Sessions will appear when testers start chatting</p>
        </CardContent></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bot</TableHead>
                  <TableHead>Tester</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Rating</TableHead>
                  <TableHead className="hidden sm:table-cell">Created</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{getBotName(session.botId)}</TableCell>
                    <TableCell>{getTesterName(session.clientTesterId)}</TableCell>
                    <TableCell><Badge className={statusColor(session.status)}>{session.status}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {session.reviewRating ? `${session.reviewRating}/5` : "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setLocation(`/sessions/${session.id}`)} title="View details">
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
