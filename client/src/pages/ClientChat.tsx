import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Send, ThumbsUp, ThumbsDown, Pencil, StickyNote, Star, Loader2, Bot, User, MessageSquare, CheckCircle2
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663346430490/lltjiETQWNdEtrRM.svg";

type ChatMessage = {
  id: number;
  role: "user" | "bot";
  content: string;
  editedContent?: string | null;
  createdAt: Date | string;
};

export default function ClientChat() {
  const params = useParams<{ token: string }>();
  const token = params.token || "";
  const utils = trpc.useUtils();

  const getOrCreate = trpc.sessions.getOrCreate.useMutation();
  const sendMessage = trpc.messages.send.useMutation();
  const submitFeedback = trpc.messages.feedback.useMutation();
  const editMessage = trpc.messages.edit.useMutation();
  const saveNote = trpc.notes.saveSessionNote.useMutation();
  const submitReview = trpc.reviews.submit.useMutation();

  const [session, setSession] = useState<any>(null);
  const [bot, setBot] = useState<any>(null);
  const [tester, setTester] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [feedbackModal, setFeedbackModal] = useState<{ messageId: number; type: "like" | "dislike" } | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [editModal, setEditModal] = useState<{ messageId: number; content: string } | null>(null);
  const [editContent, setEditContent] = useState("");
  const [notesModal, setNotesModal] = useState(false);
  const [notesContent, setNotesContent] = useState("");
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize session
  useEffect(() => {
    if (!token) return;
    getOrCreate.mutate({ shareToken: token }, {
      onSuccess: (data) => {
        setSession(data.session);
        setBot(data.bot);
        setTester(data.tester);
        setMessages(data.messages as ChatMessage[]);
        if (data.note) setNotesContent(data.note.content);
        if (data.session.reviewSubmitted) setReviewSubmitted(true);
        setInitLoading(false);
      },
      onError: (err) => {
        setError(err.message);
        setInitLoading(false);
      },
    });
  }, [token]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!inputText.trim() || !session || isLoading) return;
    const text = inputText.trim();
    setInputText("");
    setIsLoading(true);

    // Optimistic: add user message
    const tempUserMsg: ChatMessage = { id: Date.now(), role: "user", content: text, createdAt: new Date() };
    setMessages((prev) => [...prev, tempUserMsg]);

    sendMessage.mutate({ sessionId: session.id, content: text, shareToken: token }, {
      onSuccess: (data) => {
        // Replace temp with real messages
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [
            ...filtered,
            { id: data.userMsgId, role: "user", content: text, createdAt: new Date() },
            { id: data.botMsgId, role: "bot", content: data.botReply, createdAt: new Date() },
          ];
        });
        setIsLoading(false);
      },
      onError: (err) => {
        toast.error("Failed to send message");
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        setInputText(text);
        setIsLoading(false);
      },
    });
  };

  const handleFeedback = () => {
    if (!feedbackModal || !session) return;
    submitFeedback.mutate({
      messageId: feedbackModal.messageId,
      sessionId: session.id,
      feedbackType: feedbackModal.type,
      comment: feedbackComment || undefined,
      shareToken: token,
    }, {
      onSuccess: () => {
        toast.success(feedbackModal.type === "like" ? "Positive feedback submitted" : "Feedback submitted");
        setFeedbackModal(null);
        setFeedbackComment("");
      },
    });
  };

  const handleEdit = () => {
    if (!editModal) return;
    editMessage.mutate({
      messageId: editModal.messageId,
      editedContent: editContent,
      shareToken: token,
    }, {
      onSuccess: () => {
        setMessages((prev) => prev.map((m) => m.id === editModal.messageId ? { ...m, editedContent: editContent } : m));
        toast.success("Message edited");
        setEditModal(null);
        setEditContent("");
      },
    });
  };

  const handleSaveNotes = () => {
    if (!session) return;
    saveNote.mutate({ sessionId: session.id, content: notesContent, shareToken: token }, {
      onSuccess: () => { toast.success("Notes saved"); setNotesModal(false); },
    });
  };

  const handleSubmitReview = () => {
    if (!session) return;
    submitReview.mutate({
      sessionId: session.id,
      rating: reviewRating,
      comment: reviewComment || undefined,
      shareToken: token,
    }, {
      onSuccess: () => {
        toast.success("Review submitted! Thank you for your feedback.");
        setReviewSubmitted(true);
        setReviewModal(false);
      },
    });
  };

  if (initLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F8FA]">
        <div className="flex flex-col items-center gap-4">
          <img src={LOGO_URL} alt="DK-OctoBot" className="h-16 w-16 animate-pulse" />
          <p className="text-[#083D77] font-medium">Loading your chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F8FA]">
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <img src={LOGO_URL} alt="DK-OctoBot" className="h-16 w-16 opacity-50" />
          <h2 className="text-lg font-semibold text-[#083D77]">Link Invalid</h2>
          <p className="text-sm text-gray-500">This chat link is not valid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F5F8FA]">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          {bot?.brandLogoUrl ? (
            <img src={bot.brandLogoUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <img src={LOGO_URL} alt="DK-OctoBot" className="h-9 w-9" />
          )}
          <div>
            <h1 className="font-semibold text-[#083D77] text-sm leading-tight">{bot?.name || "AI Bot"}</h1>
            <p className="text-xs text-gray-500">Testing as {tester?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setNotesModal(true)} className="text-[#4682B4]" title="Session Notes">
            <StickyNote className="h-4 w-4" />
          </Button>
          {!reviewSubmitted ? (
            <Button variant="default" size="sm" onClick={() => setReviewModal(true)} className="bg-[#083D77] hover:bg-[#083D77]/90 text-xs">
              Submit Review
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-green-600 text-xs">
              <CheckCircle2 className="h-4 w-4" />
              <span>Reviewed</span>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* First message from bot */}
        {bot?.firstMessage && messages.length === 0 && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-[#E0F4FF] flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-[#4CC9F0]" />
            </div>
            <div className="max-w-[85%] sm:max-w-[70%]">
              <div className="rounded-2xl rounded-tl-sm p-3 bg-white shadow-sm text-sm">
                <Streamdown>{bot.firstMessage}</Streamdown>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-[#D4E8F7]" : "bg-[#E0F4FF]"}`}>
                {isUser ? <User className="h-4 w-4 text-[#083D77]" /> : <Bot className="h-4 w-4 text-[#4CC9F0]" />}
              </div>
              <div className={`max-w-[85%] sm:max-w-[70%] space-y-1`}>
                <div className={`rounded-2xl p-3 text-sm shadow-sm ${isUser ? "bg-[#083D77] text-white rounded-tr-sm" : "bg-white rounded-tl-sm"}`}>
                  <Streamdown>{msg.content}</Streamdown>
                </div>
                {msg.editedContent && (
                  <div className="rounded-xl p-2 text-xs bg-yellow-50 border border-yellow-200">
                    <span className="text-yellow-700 font-medium">Edited: </span>
                    <Streamdown>{msg.editedContent}</Streamdown>
                  </div>
                )}
                {/* Action buttons for bot messages */}
                {!isUser && (
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => { setFeedbackModal({ messageId: msg.id, type: "like" }); setFeedbackComment(""); }} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" title="Like">
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setFeedbackModal({ messageId: msg.id, type: "dislike" }); setFeedbackComment(""); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Dislike">
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setEditModal({ messageId: msg.id, content: msg.content }); setEditContent(msg.editedContent || msg.content); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Edit response">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-[#E0F4FF] flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-[#4CC9F0]" />
            </div>
            <div className="rounded-2xl rounded-tl-sm p-3 bg-white shadow-sm">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-white px-4 py-3 shrink-0">
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          <Textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type your message..."
            className="resize-none min-h-[44px] max-h-32 bg-[#F5F8FA] border-[#E8F1F8] focus:border-[#4CC9F0] rounded-xl"
            rows={1}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={!inputText.trim() || isLoading} className="bg-[#083D77] hover:bg-[#083D77]/90 rounded-xl h-11 w-11 p-0 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Feedback Modal */}
      <Dialog open={!!feedbackModal} onOpenChange={(o) => { if (!o) setFeedbackModal(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {feedbackModal?.type === "like" ? (
                <><ThumbsUp className="h-5 w-5 text-green-600" />Positive Feedback</>
              ) : (
                <><ThumbsDown className="h-5 w-5 text-red-500" />Negative Feedback</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>{feedbackModal?.type === "like" ? "What did you like about this response?" : "What should be improved?"}</Label>
            <Textarea value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} placeholder="Add your comment..." rows={3} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleFeedback} disabled={submitFeedback.isPending}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editModal} onOpenChange={(o) => { if (!o) setEditModal(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-blue-600" />Edit Response</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Customize the ideal response for this message:</Label>
            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={6} className="font-mono text-sm" />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleEdit} disabled={editMessage.isPending}>Save Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={notesModal} onOpenChange={setNotesModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><StickyNote className="h-5 w-5 text-[#4682B4]" />Session Notes</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Add notes or feedback for the admin team:</Label>
            <Textarea value={notesContent} onChange={(e) => setNotesContent(e.target.value)} rows={6} placeholder="Write your notes here..." />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSaveNotes} disabled={saveNote.isPending}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={reviewModal} onOpenChange={setReviewModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" />Submit Review</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setReviewRating(n)} className={`p-1 transition-colors ${n <= reviewRating ? "text-yellow-500" : "text-gray-300"}`}>
                    <Star className="h-8 w-8" fill={n <= reviewRating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Comment (optional)</Label>
              <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={3} placeholder="Share your overall experience..." />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSubmitReview} disabled={submitReview.isPending} className="bg-[#083D77]">Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
