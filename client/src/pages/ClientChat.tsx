import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Send, ThumbsUp, ThumbsDown, Pencil, StickyNote, Star, Loader2, Bot, User,
  CheckCircle2, Sparkles, Zap, Shield, Brain
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663346430490/lltjiETQWNdEtrRM.svg";

type ChatMessage = {
  id: number;
  role: "user" | "bot";
  content: string;
  editedContent?: string | null;
  createdAt: Date | string;
};

// Animated background particles
function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
            background: `rgba(76, 201, 240, ${Math.random() * 0.3 + 0.05})`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// AI Neural network animation for loading
function NeuralLoader() {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
      <span className="text-xs text-cyan-300/70 mr-2 font-tajawal">يفكر...</span>
    </div>
  );
}

// Typing indicator
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 flex-row-reverse"
    >
      <div className="relative">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
          <Brain className="h-4 w-4 text-cyan-400" />
        </div>
        <motion.div
          className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-cyan-400"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
      <div className="rounded-2xl rounded-tr-sm px-5 py-3 bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
        <NeuralLoader />
      </div>
    </motion.div>
  );
}

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
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !session || isLoading) return;
    const text = inputText.trim();
    setInputText("");
    setIsLoading(true);

    const tempUserMsg: ChatMessage = { id: Date.now(), role: "user", content: text, createdAt: new Date() };
    setMessages((prev) => [...prev, tempUserMsg]);

    sendMessage.mutate({ sessionId: session.id, content: text, shareToken: token }, {
      onSuccess: (data) => {
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
      onError: () => {
        toast.error("فشل إرسال الرسالة");
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        setInputText(text);
        setIsLoading(false);
      },
    });
  }, [inputText, session, isLoading, token]);

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
        toast.success(feedbackModal.type === "like" ? "تم إرسال التقييم الإيجابي" : "تم إرسال الملاحظة");
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
        toast.success("تم تعديل الرسالة");
        setEditModal(null);
        setEditContent("");
      },
    });
  };

  const handleSaveNotes = () => {
    if (!session) return;
    saveNote.mutate({ sessionId: session.id, content: notesContent, shareToken: token }, {
      onSuccess: () => { toast.success("تم حفظ الملاحظات"); setNotesModal(false); },
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
        toast.success("تم إرسال التقييم! شكراً لملاحظاتك");
        setReviewSubmitted(true);
        setReviewModal(false);
      },
    });
  };

  // ============ LOADING STATE ============
  if (initLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a] font-tajawal" dir="rtl">
        <ParticleField />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-6 relative z-10"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl animate-pulse" />
            <img src={LOGO_URL} alt="DK-OctoBot" className="h-20 w-20 relative z-10 drop-shadow-[0_0_15px_rgba(76,201,240,0.4)]" />
          </motion.div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-bold text-white/90">DK-OctoBot</h2>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
            <p className="text-cyan-300/60 text-sm">جاري تحميل المحادثة...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ============ ERROR STATE ============
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a] font-tajawal" dir="rtl">
        <ParticleField />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 p-8 text-center relative z-10"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-red-400/10 rounded-full blur-xl" />
            <img src={LOGO_URL} alt="DK-OctoBot" className="h-20 w-20 opacity-40 relative z-10" />
          </div>
          <h2 className="text-xl font-bold text-white/80">الرابط غير صالح</h2>
          <p className="text-sm text-white/40 max-w-xs">هذا الرابط غير صالح أو منتهي الصلاحية. يرجى التواصل مع الفريق للحصول على رابط جديد.</p>
          <div className="flex items-center gap-2 text-xs text-white/20 mt-4">
            <Shield className="h-3 w-3" />
            <span>محمي بواسطة DK-OctoBot</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // ============ MAIN CHAT ============
  return (
    <div className="flex flex-col h-screen bg-[#0a0e1a] font-tajawal overflow-hidden" dir="rtl">
      <ParticleField />

      {/* ===== HEADER ===== */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-20 shrink-0"
      >
        <div className="bg-gradient-to-l from-[#0d1225]/95 via-[#0f1630]/95 to-[#0d1225]/95 backdrop-blur-xl border-b border-white/[0.06]">
          {/* Glow line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-l from-transparent via-cyan-500/30 to-transparent" />

          <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
            {/* Brand collaboration: OctoBot x Client Brand */}
            <div className="flex items-center gap-3">
              {/* OctoBot Logo */}
              <div className="relative group">
                <div className="absolute inset-0 bg-cyan-400/20 rounded-xl blur-md group-hover:blur-lg transition-all" />
                <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-[#0d1a30] to-[#162040] border border-cyan-500/20 flex items-center justify-center overflow-hidden">
                  <img src={LOGO_URL} alt="DK-OctoBot" className="h-7 w-7 drop-shadow-[0_0_8px_rgba(76,201,240,0.3)]" />
                </div>
              </div>

              {/* Collaboration indicator */}
              <div className="flex items-center gap-1.5">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="h-3 w-3 text-cyan-400/60" />
                </motion.div>
              </div>

              {/* Client Brand Logo */}
              {bot?.brandLogoUrl && (
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center overflow-hidden">
                    <img src={bot.brandLogoUrl} alt="" className="h-7 w-7 rounded-lg object-cover" />
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="mr-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-white/90 text-sm leading-tight">
                    {bot?.name || "AI Bot"}
                  </h1>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-medium">متصل</span>
                  </div>
                </div>
                <p className="text-[11px] text-white/30 mt-0.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  مدعوم بالذكاء الاصطناعي من DK-OctoBot
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNotesModal(true)}
                className="group relative p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-cyan-500/20 transition-all duration-300"
                title="ملاحظات الجلسة"
              >
                <StickyNote className="h-4 w-4 text-white/40 group-hover:text-cyan-400 transition-colors" />
              </button>

              {!reviewSubmitted ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setReviewModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-l from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/20 text-cyan-300 text-xs font-medium transition-all duration-300"
                >
                  <Star className="h-3.5 w-3.5" />
                  <span>إرسال التقييم</span>
                </motion.button>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">تم التقييم</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* ===== MESSAGES AREA ===== */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative z-10 scroll-smooth">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* Welcome message / First bot message */}
          {bot?.firstMessage && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start gap-3 flex-row-reverse"
            >
              <div className="relative">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                  <Bot className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0e1a]" />
              </div>
              <div className="max-w-[85%] sm:max-w-[75%]">
                <div className="rounded-2xl rounded-tr-sm px-4 py-3 bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-lg shadow-black/10">
                  <div className="text-sm text-white/80 leading-relaxed prose-invert">
                    <Streamdown>{bot.firstMessage}</Streamdown>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Chat messages */}
          <AnimatePresence mode="popLayout">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  className={`flex items-start gap-3 ${isUser ? "flex-row" : "flex-row-reverse"}`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {isUser ? (
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-400" />
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center backdrop-blur-sm">
                          <Bot className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0e1a]" />
                      </div>
                    )}
                  </div>

                  {/* Message bubble */}
                  <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-lg ${
                        isUser
                          ? "bg-gradient-to-l from-blue-600/90 to-blue-700/90 text-white rounded-tl-sm border border-blue-500/20"
                          : "bg-white/[0.04] border border-white/[0.08] backdrop-blur-md text-white/80 rounded-tr-sm"
                      }`}
                    >
                      <div className="text-sm leading-relaxed prose-invert">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    </div>

                    {/* Edited content */}
                    {msg.editedContent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="rounded-xl px-3 py-2 bg-amber-500/[0.06] border border-amber-500/20 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Pencil className="h-3 w-3 text-amber-400/70" />
                          <span className="text-[10px] text-amber-400/70 font-medium">تم التعديل</span>
                        </div>
                        <div className="text-xs text-white/60 leading-relaxed">
                          <Streamdown>{msg.editedContent}</Streamdown>
                        </div>
                      </motion.div>
                    )}

                    {/* Action buttons for bot messages */}
                    {!isUser && (
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => { setFeedbackModal({ messageId: msg.id, type: "like" }); setFeedbackComment(""); }}
                          className="group p-1.5 rounded-lg bg-white/[0.02] hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all duration-300"
                          title="إعجاب"
                        >
                          <ThumbsUp className="h-3.5 w-3.5 text-white/20 group-hover:text-emerald-400 transition-colors" />
                        </button>
                        <button
                          onClick={() => { setFeedbackModal({ messageId: msg.id, type: "dislike" }); setFeedbackComment(""); }}
                          className="group p-1.5 rounded-lg bg-white/[0.02] hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300"
                          title="عدم إعجاب"
                        >
                          <ThumbsDown className="h-3.5 w-3.5 text-white/20 group-hover:text-red-400 transition-colors" />
                        </button>
                        <button
                          onClick={() => { setEditModal({ messageId: msg.id, content: msg.content }); setEditContent(msg.editedContent || msg.content); }}
                          className="group p-1.5 rounded-lg bg-white/[0.02] hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all duration-300"
                          title="تعديل"
                        >
                          <Pencil className="h-3.5 w-3.5 text-white/20 group-hover:text-cyan-400 transition-colors" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Loading indicator */}
          <AnimatePresence>
            {isLoading && <TypingIndicator />}
          </AnimatePresence>
        </div>
      </div>

      {/* ===== INPUT AREA ===== */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative z-20 shrink-0"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-l from-transparent via-cyan-500/20 to-transparent" />
        <div className="bg-[#0d1225]/95 backdrop-blur-xl border-t border-white/[0.04] px-4 sm:px-6 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative group">
                <Textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="اكتب رسالتك هنا..."
                  className="resize-none min-h-[48px] max-h-36 bg-white/[0.04] border-white/[0.08] hover:border-white/[0.12] focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/10 rounded-xl text-white/90 placeholder:text-white/20 text-sm transition-all duration-300 font-tajawal"
                  rows={1}
                  disabled={isLoading}
                  dir="rtl"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className="h-12 w-12 rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-white/[0.06] disabled:to-white/[0.06] disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 shadow-lg shadow-cyan-500/20 disabled:shadow-none shrink-0"
              >
                <Send className="h-4 w-4 text-white rotate-180" />
              </motion.button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Shield className="h-3 w-3 text-white/10" />
              <span className="text-[10px] text-white/10">محادثة آمنة ومشفرة | DK-OctoBot</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== FEEDBACK MODAL ===== */}
      <Dialog open={!!feedbackModal} onOpenChange={(o) => { if (!o) setFeedbackModal(null); }}>
        <DialogContent className="max-w-sm bg-[#111827] border-white/[0.08] text-white font-tajawal" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white/90">
              {feedbackModal?.type === "like" ? (
                <><div className="p-1.5 rounded-lg bg-emerald-500/10"><ThumbsUp className="h-4 w-4 text-emerald-400" /></div><span>تقييم إيجابي</span></>
              ) : (
                <><div className="p-1.5 rounded-lg bg-red-500/10"><ThumbsDown className="h-4 w-4 text-red-400" /></div><span>ملاحظة سلبية</span></>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-white/60 text-sm">
              {feedbackModal?.type === "like" ? "ما الذي أعجبك في هذه الإجابة؟" : "ما الذي يجب تحسينه؟"}
            </Label>
            <Textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="أضف تعليقك هنا..."
              rows={3}
              className="bg-white/[0.04] border-white/[0.08] text-white/90 placeholder:text-white/20 font-tajawal"
              dir="rtl"
            />
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white/80">إلغاء</Button>
            </DialogClose>
            <Button
              onClick={handleFeedback}
              disabled={submitFeedback.isPending}
              className={feedbackModal?.type === "like"
                ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20"
              }
            >
              إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT MODAL ===== */}
      <Dialog open={!!editModal} onOpenChange={(o) => { if (!o) setEditModal(null); }}>
        <DialogContent className="max-w-lg bg-[#111827] border-white/[0.08] text-white font-tajawal" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white/90">
              <div className="p-1.5 rounded-lg bg-cyan-500/10"><Pencil className="h-4 w-4 text-cyan-400" /></div>
              <span>تعديل الإجابة</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-white/60 text-sm">قم بتخصيص الإجابة المثالية لهذه الرسالة:</Label>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={6}
              className="bg-white/[0.04] border-white/[0.08] text-white/90 placeholder:text-white/20 font-mono text-sm font-tajawal"
              dir="rtl"
            />
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white/80">إلغاء</Button>
            </DialogClose>
            <Button
              onClick={handleEdit}
              disabled={editMessage.isPending}
              className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20"
            >
              حفظ التعديل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== NOTES MODAL ===== */}
      <Dialog open={notesModal} onOpenChange={setNotesModal}>
        <DialogContent className="max-w-lg bg-[#111827] border-white/[0.08] text-white font-tajawal" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white/90">
              <div className="p-1.5 rounded-lg bg-blue-500/10"><StickyNote className="h-4 w-4 text-blue-400" /></div>
              <span>ملاحظات الجلسة</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-white/60 text-sm">أضف ملاحظاتك أو اقتراحاتك لفريق الإدارة:</Label>
            <Textarea
              value={notesContent}
              onChange={(e) => setNotesContent(e.target.value)}
              rows={6}
              placeholder="اكتب ملاحظاتك هنا..."
              className="bg-white/[0.04] border-white/[0.08] text-white/90 placeholder:text-white/20 font-tajawal"
              dir="rtl"
            />
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white/80">إلغاء</Button>
            </DialogClose>
            <Button
              onClick={handleSaveNotes}
              disabled={saveNote.isPending}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20"
            >
              حفظ الملاحظات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== REVIEW MODAL ===== */}
      <Dialog open={reviewModal} onOpenChange={setReviewModal}>
        <DialogContent className="max-w-sm bg-[#111827] border-white/[0.08] text-white font-tajawal" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white/90">
              <div className="p-1.5 rounded-lg bg-amber-500/10"><Star className="h-4 w-4 text-amber-400" /></div>
              <span>إرسال التقييم</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label className="text-white/60 text-sm">التقييم</Label>
              <div className="flex gap-1.5 mt-3 justify-center">
                {[1, 2, 3, 4, 5].map((n) => (
                  <motion.button
                    key={n}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setReviewRating(n)}
                    className="p-1 transition-all duration-200"
                  >
                    <Star
                      className={`h-9 w-9 transition-all duration-200 ${
                        n <= reviewRating
                          ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                          : "text-white/10"
                      }`}
                      fill={n <= reviewRating ? "currentColor" : "none"}
                    />
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-white/60 text-sm">تعليق (اختياري)</Label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                placeholder="شاركنا تجربتك الكاملة..."
                className="bg-white/[0.04] border-white/[0.08] text-white/90 placeholder:text-white/20 mt-2 font-tajawal"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white/80">إلغاء</Button>
            </DialogClose>
            <Button
              onClick={handleSubmitReview}
              disabled={submitReview.isPending}
              className="bg-gradient-to-l from-cyan-500/30 to-blue-600/30 hover:from-cyan-500/40 hover:to-blue-600/40 text-cyan-300 border border-cyan-500/20"
            >
              إرسال التقييم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
