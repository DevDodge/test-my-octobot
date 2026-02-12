import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useLocation } from "wouter";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663346430490/lltjiETQWNdEtrRM.svg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // If already logged in, redirect to dashboard
  if (user && user.role === "admin") {
    window.location.href = "/";
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "حدث خطأ في تسجيل الدخول");
        return;
      }

      // Redirect to dashboard on success
      window.location.href = "/";
    } catch (err) {
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background" dir="rtl">
      <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
        <img src={LOGO_URL} alt="DK-OctoBot" className="h-24 w-24" />
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-center text-foreground">
            لوحة تحكم DK-OctoBot
          </h1>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            سجّل الدخول لإدارة منصة اختبار بوتات الذكاء الاصطناعي.
          </p>
          <a href="https://octobot.it.com" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
            octobot.it.com
          </a>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="أدخل البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              placeholder="أدخل كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
              className="text-left"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive text-center bg-destructive/10 rounded-lg p-3">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
            disabled={loading}
          >
            {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>
        </form>
      </div>
    </div>
  );
}
