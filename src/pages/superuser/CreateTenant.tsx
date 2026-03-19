import React, { useState } from "react";
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

function parseEmails(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

interface Invite {
  email: string;
  token: string;
  role: string;
}

export default function CreateTenant() {
  const { isSuperuser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [adminEmailsText, setAdminEmailsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<Invite[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperuser || !name.trim()) return;
    setLoading(true);
    setInvites(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Missing session");

      const adminEmails = parseEmails(adminEmailsText);

      const functions = supabase.functions;
      functions.setAuth(token);
      const { data, error } = await functions.invoke("create-tenant", {
        headers: { Authorization: `Bearer ${token}` },
        body: { name: name.trim(), adminEmails },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      const res = data as { tenant?: unknown; invites?: Invite[] };
      if (res.invites?.length) {
        setInvites(res.invites);
        toast.success(t("superuser.tenantCreatedWithInvites"));
      } else {
        toast.success(t("onboarding.tenantCreated"));
        navigate("/superuser/tenants");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create tenant");
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    navigate("/superuser/tenants");
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/onboarding/accept?token=${encodeURIComponent(token)}`;
    navigator.clipboard.writeText(link);
    toast.success(t("invites.copied"));
  };

  if (!isSuperuser) {
    navigate("/");
    return null;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/superuser/tenants")}>
          {t("common.back")}
        </Button>
        <h2 className="text-2xl font-bold font-display">{t("superuser.createTenant")}</h2>
      </div>

      {invites ? (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>{t("superuser.adminInvites")}</CardTitle>
            <CardDescription>{t("superuser.adminInvitesDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {invites.map((inv) => (
                <div key={inv.email} className="flex items-center justify-between gap-2 rounded-md border p-3">
                  <span className="text-sm font-medium" dir="ltr">{inv.email}</span>
                  <Button variant="outline" size="sm" onClick={() => copyInviteLink(inv.token)}>
                    {t("invites.copyLink")}
                  </Button>
                </div>
              ))}
            </div>
            <Button onClick={handleDone} className="w-full">
              {t("superuser.done")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>{t("superuser.createTenant")}</CardTitle>
            <CardDescription>{t("superuser.createTenantDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="tenantName">{t("onboarding.tenantName")}</Label>
                <Input
                  id="tenantName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("onboarding.tenantNamePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmails">{t("superuser.adminEmails")}</Label>
                <textarea
                  id="adminEmails"
                  value={adminEmailsText}
                  onChange={(e) => setAdminEmailsText(e.target.value)}
                  placeholder={t("superuser.adminEmailsPlaceholder")}
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  dir="ltr"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
                {loading ? t("onboarding.creating") : t("superuser.createTenant")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
