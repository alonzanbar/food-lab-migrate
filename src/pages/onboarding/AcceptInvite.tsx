import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const { user, refresh } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const acceptedRef = useRef(false);

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

  const loginUrl = token
    ? `/login?redirect=${encodeURIComponent(`/onboarding/accept?token=${encodeURIComponent(token)}`)}`
    : "/login";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md card-hover">
        <CardHeader>
          <CardTitle>{t("onboarding.acceptInvite")}</CardTitle>
          <CardDescription>
            {token
              ? user
                ? loading
                  ? t("onboarding.acceptingInvite")
                  : t("onboarding.acceptInviteDesc")
                : t("onboarding.signInToAccept")
              : t("onboarding.missingInviteToken")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!user && (
            <Button className="w-full" asChild>
              <Link to={loginUrl}>{t("onboarding.signInToContinue")}</Link>
            </Button>
          )}
          {user && !loading && !token && (
            <Button className="w-full" variant="outline" asChild>
              <Link to="/onboarding">{t("onboarding.backToOnboarding")}</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

