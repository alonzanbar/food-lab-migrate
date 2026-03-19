import React, { useState } from "react";
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

export default function InviteUsers() {
  const { tenantId } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"worker" | "admin">("worker");
  const [loading, setLoading] = useState(false);
  const [lastToken, setLastToken] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Missing session");

      const functions = supabase.functions;
      functions.setAuth(token);
      const { data, error } = await functions.invoke("invite-user", {
        headers: { Authorization: `Bearer ${token}` },
        body: { email, role },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      const inviteToken = (data as { invite?: { token?: string } })?.invite?.token;
      if (!inviteToken) throw new Error("Invite created but token missing");

      setLastToken(inviteToken);
      toast.success(t("invites.inviteCreated"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setLoading(false);
    }
  };

  const inviteLink = lastToken ? `${window.location.origin}/onboarding/accept?token=${encodeURIComponent(lastToken)}` : null;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(t("invites.copied"));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">{t("invites.title")}</h2>
        <p className="text-muted-foreground">{t("invites.subtitle")}</p>
      </div>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle>{t("invites.createInvite")}</CardTitle>
          <CardDescription>{t("invites.createInviteDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleInvite}>
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">{t("invites.email")}</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("invites.role")}</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value === "admin" ? "admin" : "worker")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="worker">worker</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <Button className="w-full" type="submit" disabled={loading || !email.trim()}>
              {loading ? t("invites.creating") : t("invites.createInvite")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {inviteLink && lastToken && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>{t("invites.inviteLink")}</CardTitle>
            <CardDescription>{t("invites.inviteLinkDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={inviteLink} readOnly dir="ltr" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => copy(inviteLink)}>{t("invites.copyLink")}</Button>
              <Button variant="outline" onClick={() => copy(lastToken)}>{t("invites.copyToken")}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

