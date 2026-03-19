import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default function Onboarding() {
  const { user, tenantId, refresh } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tenantName, setTenantName] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingAccept, setLoadingAccept] = useState(false);

  const isDone = useMemo(() => !!tenantId, [tenantId]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoadingCreate(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Missing session");

      const functions = supabase.functions;
      functions.setAuth(token);

      const { data, error } = await functions.invoke("create-tenant", {
        headers: { Authorization: `Bearer ${token}` },
        body: { name: tenantName },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      await refresh();
      toast.success(t("onboarding.tenantCreated"));
      navigate("/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create tenant");
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoadingAccept(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Missing session");

      const functions = supabase.functions;
      functions.setAuth(token);

      const { data, error } = await functions.invoke("accept-invite", {
        headers: { Authorization: `Bearer ${token}` },
        body: { token: inviteToken },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      await refresh();
      toast.success(t("onboarding.joinedTenant"));
      navigate("/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to accept invite");
    } finally {
      setLoadingAccept(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-display">{t("onboarding.welcome")}</h1>
          <p className="text-muted-foreground">
            {isDone ? t("onboarding.workspaceReady") : t("onboarding.welcomeSubtitle")}
          </p>
        </div>

        {isDone ? (
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>{t("onboarding.ready")}</CardTitle>
              <CardDescription>{t("onboarding.readyDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate("/")}>{t("onboarding.continue")}</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle>{t("onboarding.createTenant")}</CardTitle>
                <CardDescription>{t("onboarding.createTenantDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCreateTenant}>
                  <div className="space-y-2">
                    <Label htmlFor="tenantName">{t("onboarding.tenantName")}</Label>
                    <Input
                      id="tenantName"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      placeholder={t("onboarding.tenantNamePlaceholder")}
                      required
                    />
                  </div>
                  <Button className="w-full" type="submit" disabled={loadingCreate || !tenantName.trim()}>
                    {loadingCreate ? t("onboarding.creating") : t("onboarding.createTenant")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <CardTitle>{t("onboarding.joinTenant")}</CardTitle>
                <CardDescription>{t("onboarding.joinTenantDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleAcceptInvite}>
                  <div className="space-y-2">
                    <Label htmlFor="inviteToken">{t("onboarding.inviteToken")}</Label>
                    <Input
                      id="inviteToken"
                      value={inviteToken}
                      onChange={(e) => setInviteToken(e.target.value)}
                      placeholder={t("onboarding.inviteTokenPlaceholder")}
                      required
                      dir="ltr"
                    />
                  </div>
                  <Button className="w-full" type="submit" disabled={loadingAccept || !inviteToken.trim()}>
                    {loadingAccept ? t("onboarding.joining") : t("onboarding.joinButton")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

