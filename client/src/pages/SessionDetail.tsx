import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, ThumbsUp, ThumbsDown, Pencil, StickyNote, User, Bot } from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const sessionId = parseInt(params.id || "0");
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.sessions.getDetail.useQuery({ id: sessionId });
  const { data: bots } = trpc.bots.list.useQuery();
  const { data: testers } = trpc.testers.list.useQuery();
  const { data: allMembers } = trpc.teams.members.listAll.useQuery();
  const updateSession = trpc.sessions.update.useMutation({ onSuccess: () => { utils.sessions.getDetail.invalidate({ id: sessionId }); toast.success("Session updated"); } });

  const { data: exportTxt } = trpc.sessions.export.useQuery({ id: sessionId, format: "txt" }, { enabled: false });
  const { data: exportMd } = trpc.sessions.export.useQuery({ id: sessionId, format: "md" }, { enabled: false });

  const [adminNotes, setAdminNotes] = useState("");
  const [notesEditing, setNotesEditing] = useState(false);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!data) return <div className="text-center py-12 text-muted-foreground">Session not found</div>;

  const { session, messages: msgs, feedback, note } = data;
  const bot = bots?.find((b) => b.id === session.botId);
  const tester = testers?.find((t) => t.id === session.clientTesterId);

  const feedbackMap = new Map<number, typeof feedback>();
  feedback.forEach((f) => {
    const existing = feedbackMap.get(f.messageId) || [];
    existing.push(f);
    feedbackMap.set(f.messageId, existing);
  });

  const statusColor = (s: string) => s === "live" ? "bg-green-100 text-green-700" : s === "completed" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700";

  const handleExport = async (format: "txt" | "md") => {
    try {
      const res = await utils.sessions.export.fetch({ id: sessionId, format });
      const blob = new Blob([res], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `session-${session.sessionToken}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch { toast.error("Export failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/sessions")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Session Detail</h1>
            <p className="text-sm text-muted-foreground">{bot?.name} - {tester?.name}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => handleExport("txt")}>
            <Download className="h-3 w-3 mr-1" />TXT
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("md")}>
            <Download className="h-3 w-3 mr-1" />MD
          </Button>
        </div>
      </div>

      {/* Session Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge className={statusColor(session.status)}>{session.status}</Badge>
              <Select value={session.status} onValueChange={(v) => updateSession.mutate({ id: sessionId, status: v as any })}>
                <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Review</div>
            <div className="mt-1">
              {session.reviewSubmitted ? (
                <div>
                  <span className="text-lg font-bold">{session.reviewRating}/5</span>
                  {session.reviewComment && <p className="text-sm text-muted-foreground mt-1">{session.reviewComment}</p>}
                </div>
              ) : <span className="text-muted-foreground">Not submitted</span>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Assigned To</div>
            <div className="mt-1">
              <Select value={session.assignedTeamMemberId?.toString() || "none"} onValueChange={(v) => updateSession.mutate({ id: sessionId, assignedTeamMemberId: v === "none" ? undefined : parseInt(v) })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Assign member" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {allMembers?.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.memberName} ({m.teamName})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <StickyNote className="h-4 w-4" />Admin Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notesEditing ? (
            <div className="space-y-2">
              <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} placeholder="Add notes about this session..." />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { updateSession.mutate({ id: sessionId, adminNotes }); setNotesEditing(false); }}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setNotesEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="cursor-pointer" onClick={() => { setAdminNotes(session.adminNotes || ""); setNotesEditing(true); }}>
              {session.adminNotes ? <p className="text-sm">{session.adminNotes}</p> : <p className="text-sm text-muted-foreground">Click to add notes...</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Session Notes */}
      {note && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-[#4CC9F0]" />Client Notes
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm">{note.content}</p></CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Chat History ({msgs.length} messages)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {msgs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No messages yet</p>
          ) : (
            msgs.map((msg) => {
              const isUser = msg.role === "user";
              const fb = feedbackMap.get(msg.id) || [];
              return (
                <div key={msg.id} className={`flex gap-3 ${isUser ? "" : ""}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-[#D4E8F7]" : "bg-[#E0F4FF]"}`}>
                    {isUser ? <User className="h-4 w-4 text-[#083D77]" /> : <Bot className="h-4 w-4 text-[#4CC9F0]" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{isUser ? "Client" : "Bot"}</span>
                      <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className={`rounded-lg p-3 text-sm ${isUser ? "bg-[#D4E8F7]" : "bg-[#E0F4FF]"}`}>
                      <Streamdown>{msg.content}</Streamdown>
                    </div>
                    {msg.editedContent && (
                      <div className="rounded-lg p-3 text-sm bg-yellow-50 border border-yellow-200">
                        <div className="flex items-center gap-1 text-xs text-yellow-700 mb-1"><Pencil className="h-3 w-3" />Edited Response</div>
                        <Streamdown>{msg.editedContent}</Streamdown>
                      </div>
                    )}
                    {fb.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {fb.map((f) => (
                          <div key={f.id} className={`text-xs rounded px-2 py-1 flex items-center gap-1 ${f.feedbackType === "like" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                            {f.feedbackType === "like" ? <ThumbsUp className="h-3 w-3" /> : <ThumbsDown className="h-3 w-3" />}
                            {f.comment || "No comment"}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
