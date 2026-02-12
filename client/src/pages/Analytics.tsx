import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, MessageSquare, ThumbsUp, ThumbsDown, Activity } from "lucide-react";

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = trpc.analytics.overview.useQuery();
  const { data: bots } = trpc.bots.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <div><h1 className="text-2xl font-bold tracking-tight">التحليلات</h1></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16" /></CardContent></Card>)}
        </div>
      </div>
    );
  }

  const satisfactionRate = analytics && (analytics.totalLikes + analytics.totalDislikes) > 0
    ? Math.round((analytics.totalLikes / (analytics.totalLikes + analytics.totalDislikes)) * 100)
    : 0;

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">التحليلات</h1>
        <p className="text-muted-foreground mt-1">مقاييس الأداء وأنماط التفاعل</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#083D77]/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-[#083D77]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.totalSessions || 0}</p>
                <p className="text-xs text-muted-foreground">إجمالي الجلسات</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#4CC9F0]/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-[#4CC9F0]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.totalMessages || 0}</p>
                <p className="text-xs text-muted-foreground">الرسائل</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{satisfactionRate}%</p>
                <p className="text-xs text-muted-foreground">نسبة الرضا</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#4682B4]/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-[#4682B4]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.liveSessions || 0}</p>
                <p className="text-xs text-muted-foreground">مباشر الآن</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">تفصيل حالات الجلسات</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "مباشر", value: analytics?.liveSessions || 0, color: "bg-green-500", total: analytics?.totalSessions || 1 },
                { label: "مكتمل", value: analytics?.completedSessions || 0, color: "bg-blue-500", total: analytics?.totalSessions || 1 },
                { label: "تمت المراجعة", value: analytics?.reviewedSessions || 0, color: "bg-purple-500", total: analytics?.totalSessions || 1 },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${Math.max(2, (item.value / item.total) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">توزيع التقييمات</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <ThumbsUp className="h-7 w-7 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{analytics?.totalLikes || 0}</p>
                  <p className="text-xs text-muted-foreground">إعجابات</p>
                </div>
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                    <ThumbsDown className="h-7 w-7 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-500">{analytics?.totalDislikes || 0}</p>
                  <p className="text-xs text-muted-foreground">عدم إعجاب</p>
                </div>
              </div>
              {(analytics?.totalLikes || 0) + (analytics?.totalDislikes || 0) > 0 && (
                <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                  <div className="bg-green-500 h-full transition-all" style={{ width: `${satisfactionRate}%` }} />
                  <div className="bg-red-400 h-full transition-all" style={{ width: `${100 - satisfactionRate}%` }} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Bot Analytics */}
      {bots && bots.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">أداء البوتات</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bots.map((bot) => (
                <BotAnalyticsCard key={bot.id} bot={bot} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BotAnalyticsCard({ bot }: { bot: any }) {
  const { data } = trpc.bots.analytics.useQuery({ id: bot.id });

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center gap-2">
        {bot.brandLogoUrl ? (
          <img src={bot.brandLogoUrl} alt="" className="h-6 w-6 rounded" />
        ) : (
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-3 w-3 text-primary" />
          </div>
        )}
        <span className="font-medium text-sm truncate">{bot.name}</span>
      </div>
      {data ? (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-muted-foreground">الجلسات:</span> <span className="font-medium">{data.totalSessions}</span></div>
          <div><span className="text-muted-foreground">مباشر:</span> <span className="font-medium text-green-600">{data.liveSessions}</span></div>
          <div><span className="text-muted-foreground">مكتمل:</span> <span className="font-medium">{data.completedSessions}</span></div>
          <div><span className="text-muted-foreground">متوسط التقييم:</span> <span className="font-medium">{data.avgRating || "-"}</span></div>
        </div>
      ) : (
        <Skeleton className="h-12" />
      )}
    </div>
  );
}
