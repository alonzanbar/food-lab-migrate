import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const { user, refresh, signIn } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const acceptedRef = useRef(false);

  // Auto-accept when already logged in (legacy flow)
  useEffect(() => {
    if (!token || !user || acceptedRef.current) return;
    acceptedRef.current = true;
    (async () => {
      setLoading(true);
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error("Missing session");

        const functions = supabase.functions;
        functions.setAuth(accessToken);
        const { data, error } = await functions.invoke("accept-invite", {
          headers: { Authorization: `Bearer ${accessToken}` },
          body: { token },
        });
        if (error) throw error;
        if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

        await refresh();
        toast.success(t("onboarding.joinedTenant"));
        navigate("/");
      } catch (err: unknown) {
        acceptedRef.current = false;
        toast.error(err instanceof Error ? err.message : "Failed to accept invite");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, user, refresh, navigate, t]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || password.length < 6) return;
    if (password !== confirmPassword) {
      toast.error(t("onboarding.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("accept-invite-with-password", {
        body: { token, password },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      const email = (data as { email?: string })?.email;
      if (!email) throw new Error("Missing email in response");

      const { error: signInErr } = await signIn(email, password);
      if (signInErr) throw signInErr;

      await refresh();
      toast.success(t("onboarding.joinedTenant"));
      navigate("/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md card-hover">
          <CardHeader>
            <CardTitle>{t("onboarding.acceptInvite")}</CardTitle>
            <CardDescription>{t("onboarding.missingInviteToken")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" asChild>
              <Link to="/onboarding">{t("onboarding.backToOnboarding")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in: show processing or redirect
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md card-hover">
          <CardHeader>
            <CardTitle>{t("onboarding.acceptInvite")}</CardTitle>
            <CardDescription>
              {loading ? t("onboarding.acceptingInvite") : t("onboarding.acceptInviteDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <div className="text-center text-muted-foreground">{t("common.loading")}</div>}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in: show password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md card-hover">
        <CardHeader>
          <CardTitle>{t("onboarding.setPassword")}</CardTitle>
          <CardDescription>{t("onboarding.setPasswordDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSetPassword}>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("onboarding.confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || password.length < 6 || password !== confirmPassword}>
              {loading ? t("common.loading") : t("onboarding.joinButton")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
