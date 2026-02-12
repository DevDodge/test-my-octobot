import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Send, ThumbsUp, ThumbsDown, Pencil, StickyNote, Star, Loader2, Bot, User,
  CheckCircle2, Sparkles, Zap, Shield, Brain, Sun, Moon, Megaphone, Phone
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663346430490/lltjiETQWNdEtrRM.svg";
const WHATSAPP_LINK = "https://wa.me/201505354810";

type ChatMessage = {
  id: number;
  role: "user" | "bot";
  content: string;
  editedContent?: string | null;
  createdAt: Date | string;
};

type ChatTheme = "dark" | "light";

// ============ ANIMATED BACKGROUND PARTICLES ============
function ParticleField({ theme }: { theme: ChatTheme }) {
  const particleColor = theme === "dark" ? "rgba(76, 201, 240," : "rgba(8, 61, 119,";
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
            background: `${particleColor}${Math.random() * 0.3 + 0.05})`,
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

// ============ NEURAL LOADER ============
function NeuralLoader({ theme }: { theme: ChatTheme }) {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`w-2 h-2 rounded-full ${theme === "dark" ? "bg-gradient-to-r from-cyan-400 to-blue-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"}`}
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
      <span className={`text-xs mr-2 font-tajawal ${theme === "dark" ? "text-cyan-300/70" : "text-blue-500/70"}`}>يفكر...</span>
    </div>
  );
}

// ============ TYPING INDICATOR ============
function TypingIndicator({ theme }: { theme: ChatTheme }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 flex-row-reverse"
    >
      <div className="relative">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm ${
          theme === "dark"
            ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20"
            : "bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200"
        }`}>
          <Brain className={`h-4 w-4 ${theme === "dark" ? "text-cyan-400" : "text-blue-600"}`} />
        </div>
        <motion.div
          className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full ${theme === "dark" ? "bg-cyan-400" : "bg-blue-500"}`}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
      <div className={`rounded-2xl rounded-tr-sm px-5 py-3 backdrop-blur-md ${
        theme === "dark"
          ? "bg-white/[0.04] border border-white/[0.08]"
          : "bg-white border border-gray-200 shadow-sm"
      }`}>
        <NeuralLoader theme={theme} />
      </div>
    </motion.div>
  );
}

// ============ BANNER DISPLAY ============
function BannerDisplay({ banners, theme }: { banners: any[]; theme: ChatTheme }) {
  if (!banners || banners.length === 0) return null;
  return (
    <div className="space-y-2 mb-4">
      {banners.map((banner) => (
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl px-4 py-3 flex items-start gap-3 ${
            theme === "dark"
              ? "bg-amber-500/[0.08] border border-amber-500/20"
              : "bg-amber-50 border border-amber-200"
          }`}
        >
          <Megaphone className={`h-4 w-4 shrink-0 mt-0.5 ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`} />
          <div>
            <p className={`text-xs font-bold ${theme === "dark" ? "text-amber-300" : "text-amber-700"}`}>{banner.title}</p>
            <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-amber-300/70" : "text-amber-600/80"}`}>{banner.content}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ============ PAUSED BOT STATE (not_live) ============
function PausedBotScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a] font-tajawal" dir="rtl">
      <ParticleField theme="dark" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6 p-8 text-center relative z-10 max-w-md"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-amber-400/10 rounded-full blur-xl animate-pulse" />
          <img src={LOGO_URL} alt="DK-OctoBot" className="h-20 w-20 relative z-10 opacity-60" />
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white/80">المحادثة متوقفة مؤقتاً</h2>
          <p className="text-sm text-white/40 leading-relaxed">
            نحن نعمل على تحديثات لتحسين تجربتك. سنعيد فتح المحادثة فور الانتهاء من التحديثات.
          </p>
          <p className="text-sm text-amber-400/60 font-medium">
            شكراً لصبرك وتفهمك!
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/20 mt-4">
          <Shield className="h-3 w-3" />
          <span>محمي بواسطة DK-OctoBot</span>
        </div>
      </motion.div>
    </div>
  );
}

// ============ ARCHIVED/CANCELLED BOT STATE ============
function ArchivedBotScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a] font-tajawal" dir="rtl">
      <ParticleField theme="dark" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6 p-8 text-center relative z-10 max-w-md"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-red-400/10 rounded-full blur-xl" />
          <img src={LOGO_URL} alt="DK-OctoBot" className="h-20 w-20 relative z-10 opacity-50" />
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white/80">نحن نفتقدك!</h2>
          <p className="text-sm text-white/40 leading-relaxed">
            يؤسفنا أنك تأخرت كثيراً عن أن تكون جزءاً من عائلتنا... نحن بانتظارك الآن!
          </p>
          <p className="text-sm text-cyan-400/70 font-medium">
            تواصل معنا وسنعيدك إلى المسار الصحيح
          </p>
        </div>
        <motion.a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-l from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-medium text-sm shadow-lg shadow-green-500/20 transition-all duration-300"
        >
          <Phone className="h-4 w-4" />
          <span>اتصل بنا</span>
        </motion.a>
        <div className="flex items-center gap-2 text-xs text-white/20 mt-4">
          <Shield className="h-3 w-3" />
          <span>محمي بواسطة DK-OctoBot</span>
        </div>
      </motion.div>
    </div>
  );
}

// ============ MAIN COMPONENT ============
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
  const [chatTheme, setChatTheme] = useState<ChatTheme>(() => {
    return (localStorage.getItem("chat-theme") as ChatTheme) || "dark";
  });

  // Banners
  const [banners, setBanners] = useState<any[]>([]);

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

  const toggleChatTheme = () => {
    const next = chatTheme === "dark" ? "light" : "dark";
    setChatTheme(next);
    localStorage.setItem("chat-theme", next);
  };

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

  // Fetch banners for bot
  const bannersQuery = trpc.banners.getForBot.useQuery(
    { botId: bot?.id || 0 },
    { enabled: !!bot?.id }
  );

  useEffect(() => {
    if (bannersQuery.data) {
      setBanners(bannersQuery.data);
    }
  }, [bannersQuery.data]);

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

  // Theme-dependent classes
  const isDark = chatTheme === "dark";
  const bgMain = isDark ? "bg-[#0a0e1a]" : "bg-gradient-to-b from-gray-50 to-white";
  const headerBg = isDark
    ? "bg-gradient-to-l from-[#0d1225]/95 via-[#0f1630]/95 to-[#0d1225]/95 backdrop-blur-xl border-b border-white/[0.06]"
    : "bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm";
  const inputAreaBg = isDark
    ? "bg-[#0d1225]/95 backdrop-blur-xl border-t border-white/[0.04]"
    : "bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-sm";
  const textPrimary = isDark ? "text-white/90" : "text-gray-900";
  const textSecondary = isDark ? "text-white/40" : "text-gray-500";
  const textMuted = isDark ? "text-white/20" : "text-gray-300";
  const modalBg = isDark ? "bg-[#111827] border-white/[0.08] text-white" : "bg-white border-gray-200 text-gray-900";
  const modalInputBg = isDark ? "bg-white/[0.04] border-white/[0.08] text-white/90 placeholder:text-white/20" : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400";
  const modalBtnOutline = isDark ? "bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white/80" : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-800";

  // ============ LOADING STATE ============
  if (initLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${bgMain} font-tajawal`} dir="rtl">
        <ParticleField theme={chatTheme} />
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
            <div className={`absolute inset-0 rounded-full blur-xl animate-pulse ${isDark ? "bg-cyan-400/20" : "bg-blue-400/20"}`} />
            <img src={LOGO_URL} alt="DK-OctoBot" className={`h-20 w-20 relative z-10 ${isDark ? "drop-shadow-[0_0_15px_rgba(76,201,240,0.4)]" : "drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]"}`} />
          </motion.div>
          <div className="flex flex-col items-center gap-2">
            <h2 className={`text-xl font-bold ${textPrimary}`}>DK-OctoBot</h2>
            <div className="flex items-center gap-2">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-cyan-400" : "bg-blue-500"}`}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <p className={`text-sm ${isDark ? "text-cyan-300/60" : "text-blue-500/60"}`}>جاري تحميل المحادثة...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ============ ERROR STATE ============
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a] font-tajawal" dir="rtl">
        <ParticleField theme="dark" />
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

  // ============ BOT STATUS CHECKS ============
  // not_live = paused state
  if (bot?.status === "not_live") {
    return <PausedBotScreen />;
  }
  // cancelled = archived state
  if (bot?.status === "cancelled") {
    return <ArchivedBotScreen />;
  }

  // ============ MAIN CHAT ============
  return (
    <div className={`flex flex-col h-screen ${bgMain} font-tajawal overflow-hidden`} dir="rtl">
      <ParticleField theme={chatTheme} />

      {/* ===== HEADER ===== */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-20 shrink-0"
      >
        <div className={headerBg}>
          {/* Glow line */}
          <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-l from-transparent ${isDark ? "via-cyan-500/30" : "via-blue-500/20"} to-transparent`} />

          <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
            {/* Brand collaboration */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className={`absolute inset-0 rounded-xl blur-md group-hover:blur-lg transition-all ${isDark ? "bg-cyan-400/20" : "bg-blue-400/10"}`} />
                <div className={`relative h-10 w-10 rounded-xl flex items-center justify-center overflow-hidden ${
                  isDark
                    ? "bg-gradient-to-br from-[#0d1a30] to-[#162040] border border-cyan-500/20"
                    : "bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200"
                }`}>
                  <img src={LOGO_URL} alt="DK-OctoBot" className={`h-7 w-7 ${isDark ? "drop-shadow-[0_0_8px_rgba(76,201,240,0.3)]" : ""}`} />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Zap className={`h-3 w-3 ${isDark ? "text-cyan-400/60" : "text-blue-400/60"}`} />
                </motion.div>
              </div>

              {bot?.brandLogoUrl && (
                <div className="relative">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center overflow-hidden ${
                    isDark ? "bg-white/[0.06] border border-white/[0.1]" : "bg-gray-50 border border-gray-200"
                  }`}>
                    <img src={bot.brandLogoUrl} alt="" className="h-7 w-7 rounded-lg object-cover" />
                  </div>
                </div>
              )}

              <div className="mr-1">
                <div className="flex items-center gap-2">
                  <h1 className={`font-bold text-sm leading-tight ${textPrimary}`}>
                    {bot?.name || "AI Bot"}
                  </h1>
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${isDark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-green-50 border border-green-200"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? "bg-emerald-400" : "bg-green-500"}`} />
                    <span className={`text-[10px] font-medium ${isDark ? "text-emerald-400" : "text-green-600"}`}>متصل</span>
                  </div>
                </div>
                <p className={`text-[11px] mt-0.5 flex items-center gap-1 ${textSecondary}`}>
                  <Sparkles className="h-3 w-3" />
                  مدعوم بالذكاء الاصطناعي من DK-OctoBot
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={toggleChatTheme}
                className={`group relative p-2 rounded-xl transition-all duration-300 ${
                  isDark
                    ? "bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-cyan-500/20"
                    : "bg-gray-100 hover:bg-gray-200 border border-gray-200 hover:border-blue-300"
                }`}
                title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-white/40 group-hover:text-amber-400 transition-colors" />
                ) : (
                  <Moon className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                )}
              </button>

              <button
                onClick={() => setNotesModal(true)}
                className={`group relative p-2 rounded-xl transition-all duration-300 ${
                  isDark
                    ? "bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-cyan-500/20"
                    : "bg-gray-100 hover:bg-gray-200 border border-gray-200 hover:border-blue-300"
                }`}
                title="ملاحظات الجلسة"
              >
                <StickyNote className={`h-4 w-4 transition-colors ${isDark ? "text-white/40 group-hover:text-cyan-400" : "text-gray-400 group-hover:text-blue-500"}`} />
              </button>

              {!reviewSubmitted ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setReviewModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                    isDark
                      ? "bg-gradient-to-l from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/20 text-cyan-300"
                      : "bg-gradient-to-l from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 border border-blue-300 text-blue-600"
                  }`}
                >
                  <Star className="h-3.5 w-3.5" />
                  <span>إرسال التقييم</span>
                </motion.button>
              ) : (
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${isDark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-green-50 border border-green-200"}`}>
                  <CheckCircle2 className={`h-3.5 w-3.5 ${isDark ? "text-emerald-400" : "text-green-600"}`} />
                  <span className={`text-xs font-medium ${isDark ? "text-emerald-400" : "text-green-600"}`}>تم التقييم</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* ===== MESSAGES AREA ===== */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative z-10 scroll-smooth">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* Banners */}
          <BannerDisplay banners={banners} theme={chatTheme} />

          {/* Welcome message */}
          {bot?.firstMessage && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start gap-3 flex-row-reverse"
            >
              <div className="relative">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm ${
                  isDark
                    ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20"
                    : "bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200"
                }`}>
                  <Bot className={`h-4 w-4 ${isDark ? "text-cyan-400" : "text-blue-600"}`} />
                </div>
                <div className={`absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full border-2 ${isDark ? "bg-emerald-400 border-[#0a0e1a]" : "bg-green-500 border-white"}`} />
              </div>
              <div className="max-w-[85%] sm:max-w-[75%]">
                <div className={`rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg ${
                  isDark
                    ? "bg-white/[0.04] border border-white/[0.08] backdrop-blur-md"
                    : "bg-white border border-gray-200 shadow-md"
                }`}>
                  <div className={`text-sm leading-relaxed ${isDark ? "text-white/80 prose-invert" : "text-gray-700"}`}>
                    <Streamdown>{bot.firstMessage}</Streamdown>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Chat messages */}
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => {
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
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                        isDark
                          ? "bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/20"
                          : "bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200"
                      }`}>
                        <User className={`h-4 w-4 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                      </div>
                    ) : (
                      <div className="relative">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center backdrop-blur-sm ${
                          isDark
                            ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20"
                            : "bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200"
                        }`}>
                          <Bot className={`h-4 w-4 ${isDark ? "text-cyan-400" : "text-blue-600"}`} />
                        </div>
                        <div className={`absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full border-2 ${isDark ? "bg-emerald-400 border-[#0a0e1a]" : "bg-green-500 border-white"}`} />
                      </div>
                    )}
                  </div>

                  {/* Message bubble */}
                  <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-lg ${
                        isUser
                          ? isDark
                            ? "bg-gradient-to-l from-blue-600/90 to-blue-700/90 text-white rounded-tl-sm border border-blue-500/20"
                            : "bg-gradient-to-l from-blue-500 to-blue-600 text-white rounded-tl-sm shadow-blue-500/20"
                          : isDark
                            ? "bg-white/[0.04] border border-white/[0.08] backdrop-blur-md text-white/80 rounded-tr-sm"
                            : "bg-white border border-gray-200 text-gray-700 rounded-tr-sm shadow-md"
                      }`}
                    >
                      <div className={`text-sm leading-relaxed ${!isUser && isDark ? "prose-invert" : ""}`}>
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    </div>

                    {/* Edited content */}
                    {msg.editedContent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className={`rounded-xl px-3 py-2 backdrop-blur-sm ${
                          isDark
                            ? "bg-amber-500/[0.06] border border-amber-500/20"
                            : "bg-amber-50 border border-amber-200"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Pencil className={`h-3 w-3 ${isDark ? "text-amber-400/70" : "text-amber-600"}`} />
                          <span className={`text-[10px] font-medium ${isDark ? "text-amber-400/70" : "text-amber-600"}`}>تم التعديل</span>
                        </div>
                        <div className={`text-xs leading-relaxed ${isDark ? "text-white/60" : "text-gray-600"}`}>
                          <Streamdown>{msg.editedContent}</Streamdown>
                        </div>
                      </motion.div>
                    )}

                    {/* Action buttons for bot messages */}
                    {!isUser && (
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => { setFeedbackModal({ messageId: msg.id, type: "like" }); setFeedbackComment(""); }}
                          className={`group p-1.5 rounded-lg border border-transparent transition-all duration-300 ${
                            isDark
                              ? "bg-white/[0.02] hover:bg-emerald-500/10 hover:border-emerald-500/20"
                              : "bg-gray-50 hover:bg-green-50 hover:border-green-200"
                          }`}
                          title="إعجاب"
                        >
                          <ThumbsUp className={`h-3.5 w-3.5 transition-colors ${isDark ? "text-white/20 group-hover:text-emerald-400" : "text-gray-300 group-hover:text-green-500"}`} />
                        </button>
                        <button
                          onClick={() => { setFeedbackModal({ messageId: msg.id, type: "dislike" }); setFeedbackComment(""); }}
                          className={`group p-1.5 rounded-lg border border-transparent transition-all duration-300 ${
                            isDark
                              ? "bg-white/[0.02] hover:bg-red-500/10 hover:border-red-500/20"
                              : "bg-gray-50 hover:bg-red-50 hover:border-red-200"
                          }`}
                          title="عدم إعجاب"
                        >
                          <ThumbsDown className={`h-3.5 w-3.5 transition-colors ${isDark ? "text-white/20 group-hover:text-red-400" : "text-gray-300 group-hover:text-red-500"}`} />
                        </button>
                        <button
                          onClick={() => { setEditModal({ messageId: msg.id, content: msg.content }); setEditContent(msg.editedContent || msg.content); }}
                          className={`group p-1.5 rounded-lg border border-transparent transition-all duration-300 ${
                            isDark
                              ? "bg-white/[0.02] hover:bg-cyan-500/10 hover:border-cyan-500/20"
                              : "bg-gray-50 hover:bg-blue-50 hover:border-blue-200"
                          }`}
                          title="تعديل"
                        >
                          <Pencil className={`h-3.5 w-3.5 transition-colors ${isDark ? "text-white/20 group-hover:text-cyan-400" : "text-gray-300 group-hover:text-blue-500"}`} />
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
            {isLoading && <TypingIndicator theme={chatTheme} />}
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
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-l from-transparent ${isDark ? "via-cyan-500/20" : "via-blue-500/10"} to-transparent`} />
        <div className={`${inputAreaBg} px-4 sm:px-6 py-3`}>
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative group">
                <Textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="اكتب رسالتك هنا..."
                  className={`resize-none min-h-[48px] max-h-36 rounded-xl text-sm transition-all duration-300 font-tajawal ${
                    isDark
                      ? "bg-white/[0.04] border-white/[0.08] hover:border-white/[0.12] focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/10 text-white/90 placeholder:text-white/20"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 text-gray-900 placeholder:text-gray-400"
                  }`}
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
                className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${
                  isDark
                    ? "bg-gradient-to-l from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-white/[0.06] disabled:to-white/[0.06] shadow-lg shadow-cyan-500/20 disabled:shadow-none"
                    : "bg-gradient-to-l from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:from-gray-200 disabled:to-gray-200 shadow-lg shadow-blue-500/20 disabled:shadow-none"
                } disabled:cursor-not-allowed`}
              >
                <Send className="h-4 w-4 text-white rotate-180" />
              </motion.button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Shield className={`h-3 w-3 ${textMuted}`} />
              <span className={`text-[10px] ${textMuted}`}>محادثة آمنة ومشفرة | DK-OctoBot</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== FEEDBACK MODAL ===== */}
      <Dialog open={!!feedbackModal} onOpenChange={(o) => { if (!o) setFeedbackModal(null); }}>
        <DialogContent className={`max-w-sm font-tajawal ${modalBg}`} dir="rtl">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${textPrimary}`}>
              {feedbackModal?.type === "like" ? (
                <><div className={`p-1.5 rounded-lg ${isDark ? "bg-emerald-500/10" : "bg-green-50"}`}><ThumbsUp className={`h-4 w-4 ${isDark ? "text-emerald-400" : "text-green-600"}`} /></div><span>تقييم إيجابي</span></>
              ) : (
                <><div className={`p-1.5 rounded-lg ${isDark ? "bg-red-500/10" : "bg-red-50"}`}><ThumbsDown className={`h-4 w-4 ${isDark ? "text-red-400" : "text-red-600"}`} /></div><span>ملاحظة سلبية</span></>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className={`text-sm ${textSecondary}`}>
              {feedbackModal?.type === "like" ? "ما الذي أعجبك في هذه الإجابة؟" : "ما الذي يجب تحسينه؟"}
            </Label>
            <Textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="أضف تعليقك هنا..."
              rows={3}
              className={`font-tajawal ${modalInputBg}`}
              dir="rtl"
            />
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button variant="outline" className={modalBtnOutline}>إلغاء</Button>
            </DialogClose>
            <Button
              onClick={handleFeedback}
              disabled={submitFeedback.isPending}
              className={feedbackModal?.type === "like"
                ? isDark ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20" : "bg-green-500 hover:bg-green-600 text-white"
                : isDark ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20" : "bg-red-500 hover:bg-red-600 text-white"
              }
            >
              إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT MODAL ===== */}
      <Dialog open={!!editModal} onOpenChange={(o) => { if (!o) setEditModal(null); }}>
        <DialogContent className={`max-w-lg font-tajawal ${modalBg}`} dir="rtl">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${textPrimary}`}>
              <div className={`p-1.5 rounded-lg ${isDark ? "bg-cyan-500/10" : "bg-blue-50"}`}><Pencil className={`h-4 w-4 ${isDark ? "text-cyan-400" : "text-blue-600"}`} /></div>
              <span>تعديل الإجابة</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className={`text-sm ${textSecondary}`}>قم بتخصيص الإجابة المثالية لهذه الرسالة:</Label>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={6}
              className={`font-mono text-sm font-tajawal ${modalInputBg}`}
              dir="rtl"
            />
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button variant="outline" className={modalBtnOutline}>إلغاء</Button>
            </DialogClose>
            <Button
              onClick={handleEdit}
              disabled={editMessage.isPending}
              className={isDark ? "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20" : "bg-blue-500 hover:bg-blue-600 text-white"}
            >
              حفظ التعديل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== NOTES MODAL ===== */}
      <Dialog open={notesModal} onOpenChange={setNotesModal}>
        <DialogContent className={`max-w-lg font-tajawal ${modalBg}`} dir="rtl">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${textPrimary}`}>
              <div className={`p-1.5 rounded-lg ${isDark ? "bg-blue-500/10" : "bg-blue-50"}`}><StickyNote className={`h-4 w-4 ${isDark ? "text-blue-400" : "text-blue-600"}`} /></div>
              <span>ملاحظات الجلسة</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className={`text-sm ${textSecondary}`}>أضف ملاحظاتك أو اقتراحاتك لفريق الإدارة:</Label>
            <Textarea
              value={notesContent}
              onChange={(e) => setNotesContent(e.target.value)}
              rows={6}
              placeholder="اكتب ملاحظاتك هنا..."
              className={`font-tajawal ${modalInputBg}`}
              dir="rtl"
            />
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button variant="outline" className={modalBtnOutline}>إلغاء</Button>
            </DialogClose>
            <Button
              onClick={handleSaveNotes}
              disabled={saveNote.isPending}
              className={isDark ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20" : "bg-blue-500 hover:bg-blue-600 text-white"}
            >
              حفظ الملاحظات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== REVIEW MODAL ===== */}
      <Dialog open={reviewModal} onOpenChange={setReviewModal}>
        <DialogContent className={`max-w-sm font-tajawal ${modalBg}`} dir="rtl">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${textPrimary}`}>
              <div className={`p-1.5 rounded-lg ${isDark ? "bg-amber-500/10" : "bg-amber-50"}`}><Star className={`h-4 w-4 ${isDark ? "text-amber-400" : "text-amber-600"}`} /></div>
              <span>إرسال التقييم</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label className={`text-sm ${textSecondary}`}>التقييم</Label>
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
                          : textMuted
                      }`}
                      fill={n <= reviewRating ? "currentColor" : "none"}
                    />
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <Label className={`text-sm ${textSecondary}`}>تعليق (اختياري)</Label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                placeholder="شاركنا تجربتك الكاملة..."
                className={`mt-2 font-tajawal ${modalInputBg}`}
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button variant="outline" className={modalBtnOutline}>إلغاء</Button>
            </DialogClose>
            <Button
              onClick={handleSubmitReview}
              disabled={submitReview.isPending}
              className={isDark
                ? "bg-gradient-to-l from-cyan-500/30 to-blue-600/30 hover:from-cyan-500/40 hover:to-blue-600/40 text-cyan-300 border border-cyan-500/20"
                : "bg-gradient-to-l from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white"
              }
            >
              إرسال التقييم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
