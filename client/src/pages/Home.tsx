import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Users, ClipboardList, MessageSquare, ThumbsUp, ThumbsDown, Activity, CheckCircle2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: analytics, isLoading } = trpc.analytics.overview.useQuery();

  const stats = analytics
    ? [
        { label: "Total Bots", value: analytics.totalBots, icon: Bot, color: "text-[#083D77]" },
        { label: "Testers", value: analytics.totalTesters, icon: Users, color: "text-[#4682B4]" },
        { label: "Total Sessions", value: analytics.totalSessions, icon: ClipboardList, color: "text-[#4CC9F0]" },
        { label: "Live Sessions", value: analytics.liveSessions, icon: Activity, color: "text-green-500" },
        { label: "Completed", value: analytics.completedSessions, icon: CheckCircle2, color: "text-[#083D77]" },
        { label: "Reviewed", value: analytics.reviewedSessions, icon: Clock, color: "text-[#4682B4]" },
        { label: "Messages", value: analytics.totalMessages, icon: MessageSquare, color: "text-[#4CC9F0]" },
        { label: "Likes", value: analytics.totalLikes, icon: ThumbsUp, color: "text-green-500" },
        { label: "Dislikes", value: analytics.totalDislikes, icon: ThumbsDown, color: "text-red-400" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your AI bot testing platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 9 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-5 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          : stats.map((stat) => (
              <Card key={stat.label} className="hover:shadow-md transition-shadow">
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
            ))}
      </div>
    </div>
  );
}
