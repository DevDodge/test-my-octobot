import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Users, ClipboardList, MessageSquare, ThumbsUp, ThumbsDown, Activity, CheckCircle2, Clock, Search, FlaskConical, Wifi, WifiOff, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: analytics, isLoading } = trpc.analytics.overview.useQuery();

  const sessionStats = analytics
    ? [
        { label: "إجمالي الجلسات", value: analytics.totalSessions, icon: ClipboardList, color: "text-[#4CC9F0]" },
        { label: "الجلسات المباشرة", value: analytics.liveSessions, icon: Activity, color: "text-green-500" },
        { label: "المكتملة", value: analytics.completedSessions, icon: CheckCircle2, color: "text-[#083D77]" },
        { label: "تمت المراجعة", value: analytics.reviewedSessions, icon: Clock, color: "text-[#4682B4]" },
      ]
    : [];

  const botStatusStats = analytics
    ? [
        { label: "قيد المراجعة", value: analytics.botsInReview, icon: Search, color: "text-amber-500" },
        { label: "قيد الاختبار", value: analytics.botsTesting, icon: FlaskConical, color: "text-blue-500" },
        { label: "مباشر", value: analytics.botsLive, icon: Wifi, color: "text-green-500" },
        { label: "غير مباشر", value: analytics.botsNotLive, icon: WifiOff, color: "text-gray-500" },
        { label: "ملغي", value: analytics.botsCancelled, icon: XCircle, color: "text-red-500" },
      ]
    : [];

  const generalStats = analytics
    ? [
        { label: "إجمالي البوتات", value: analytics.totalBots, icon: Bot, color: "text-[#083D77]" },
        { label: "المختبرون", value: analytics.totalTesters, icon: Users, color: "text-[#4682B4]" },
        { label: "الرسائل", value: analytics.totalMessages, icon: MessageSquare, color: "text-[#4CC9F0]" },
        { label: "إعجابات", value: analytics.totalLikes, icon: ThumbsUp, color: "text-green-500" },
        { label: "عدم إعجاب", value: analytics.totalDislikes, icon: ThumbsDown, color: "text-red-400" },
      ]
    : [];

  const StatCard = ({ stat }: { stat: { label: string; value: number; icon: any; color: string } }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {stat.label}
        </CardTitle>
        <stat.icon className={`h-5 w-5 ${stat.color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
      </CardContent>
    </Card>
  );

  const SkeletonCard = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-1">نظرة عامة على منصة اختبار بوتات الذكاء الاصطناعي</p>
      </div>

      {/* General Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3">إحصائيات عامة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : generalStats.map((stat) => <StatCard key={stat.label} stat={stat} />)
          }
        </div>
      </div>

      {/* Bot Status Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3">حالات البوتات</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : botStatusStats.map((stat) => <StatCard key={stat.label} stat={stat} />)
          }
        </div>
      </div>

      {/* Session Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3">إحصائيات الجلسات</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : sessionStats.map((stat) => <StatCard key={stat.label} stat={stat} />)
          }
        </div>
      </div>
    </div>
  );
}
