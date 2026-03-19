import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

interface Tenant {
  id: string;
  name: string;
  status: string;
  created_at: string | null;
  created_by: string | null;
}

interface Member {
  id: string;
  full_name: string | null;
  role: string;
}

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const { isSuperuser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [lastInviteToken, setLastInviteToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuperuser || !id) {
      navigate("/superuser/tenants");
      return;
    }
    const fetch = async () => {
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("id, name, status, created_at, created_by")
        .eq("id", id)
        .single();
      if (tenantError || !tenantData) {
        toast.error(tenantError?.message || "Tenant not found");
        navigate("/superuser/tenants");
        return;
      }
      setTenant(tenantData as Tenant);
      setEditName(tenantData.name);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("tenant_id", id);
      const profileList = profiles || [];
      const userIds = profileList.map((p) => p.id);

      const { data: roles } = userIds.length > 0
        ? await supabase.from("user_roles").select("user_id, role").in("user_id", userIds)
        : { data: [] };
      const roleMap = Object.fromEntries((roles || []).map((r) => [r.user_id, r.role]));

      const memberList: Member[] = profileList.map((p) => ({
        id: p.id,
        full_name: p.full_name,
        role: roleMap[p.id] || "-",
      }));
      setMembers(memberList);
      setLoading(false);
    };
    fetch();
  }, [id, isSuperuser, navigate]);

  const handleSave = async () => {
    if (!tenant || !isSuperuser || editName.trim() === tenant.name) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ name: editName.trim() })
        .eq("id", tenant.id);
      if (error) throw error;
      setTenant((prev) => (prev ? { ...prev, name: editName.trim() } : null));
      toast.success(t("common.save"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!tenant || !isSuperuser) return;
    const newStatus = tenant.status === "active" ? "inactive" : "active";
    setSaving(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ status: newStatus })
        .eq("id", tenant.id);
      if (error) throw error;
      setTenant((prev) => (prev ? { ...prev, status: newStatus } : null));
      toast.success(newStatus === "active" ? t("superuser.tenantActivated") : t("superuser.tenantDeactivated"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !adminEmail.trim()) return;
    setAddAdminLoading(true);
    setLastInviteToken(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Missing session");

      const functions = supabase.functions;
      functions.setAuth(token);
      const { data, error } = await functions.invoke("assign-admin", {
        headers: { Authorization: `Bearer ${token}` },
        body: { tenantId: tenant.id, email: adminEmail.trim() },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      const inviteToken = (data as { invite?: { token?: string } })?.invite?.token;
      if (inviteToken) {
        setLastInviteToken(inviteToken);
        setAdminEmail("");
      }
      toast.success(t("invites.inviteCreated"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setAddAdminLoading(false);
    }
  };

  const copyInviteLink = (tok: string) => {
    const link = `${window.location.origin}/onboarding/accept?token=${encodeURIComponent(tok)}`;
    navigator.clipboard.writeText(link);
    toast.success(t("invites.copied"));
  };

  if (!isSuperuser) return null;
  if (loading || !tenant) return <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/superuser/tenants")}>
          {t("common.back")}
        </Button>
        <h2 className="text-2xl font-bold font-display">{tenant.name}</h2>
      </div>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle>{t("superuser.tenantDetails")}</CardTitle>
          <CardDescription>{t("superuser.tenantDetailsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("common.name")}</Label>
            <div className="flex gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <Button onClick={handleSave} disabled={saving || editName.trim() === tenant.name}>
                {saving ? t("common.loading") : t("common.save")}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {t("common.status")}:{" "}
              <span className={tenant.status === "active" ? "status-active" : "status-inactive"}>
                {tenant.status === "active" ? t("forms.active") : t("forms.inactive")}
              </span>
            </span>
            <Button
              variant={tenant.status === "active" ? "outline" : "default"}
              size="sm"
              onClick={handleToggleStatus}
              disabled={saving}
            >
              {tenant.status === "active" ? t("superuser.deactivate") : t("superuser.activate")}
            </Button>
          </div>
          {tenant.created_at && (
            <p className="text-sm text-muted-foreground" dir="ltr">
              {t("superuser.createdAt")}: {new Date(tenant.created_at).toLocaleString("he-IL")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle>{t("superuser.members")}</CardTitle>
          <CardDescription>{t("superuser.membersDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-muted-foreground">{t("superuser.noMembers")}</p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="font-medium">{m.full_name || m.id}</span>
                  <span className="text-sm text-muted-foreground">{m.role}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle>{t("superuser.addAdmin")}</CardTitle>
          <CardDescription>{t("superuser.addAdminDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-2" onSubmit={handleAddAdmin}>
            <Label htmlFor="adminEmail">{t("invites.email")}</Label>
            <div className="flex gap-2">
              <Input
                id="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@example.com"
                dir="ltr"
                className="flex-1"
              />
              <Button type="submit" disabled={addAdminLoading || !adminEmail.trim()}>
                {addAdminLoading ? t("common.loading") : t("superuser.addAdmin")}
              </Button>
            </div>
          </form>
          {lastInviteToken && (
            <div className="flex gap-2 items-center">
              <Input
                value={`${window.location.origin}/onboarding/accept?token=${encodeURIComponent(lastInviteToken)}`}
                readOnly
                dir="ltr"
                className="text-sm"
              />
              <Button variant="outline" size="sm" onClick={() => copyInviteLink(lastInviteToken)}>
                {t("invites.copyLink")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
