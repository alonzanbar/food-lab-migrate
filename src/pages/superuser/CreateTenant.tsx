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

interface AdminEntry {
  id: string;
  email: string;
  password: string;
  fullName: string;
}

export default function CreateTenant() {
  const { isSuperuser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [admins, setAdmins] = useState<AdminEntry[]>([
    { id: crypto.randomUUID(), email: "", password: "", fullName: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const addAdmin = () => {
    setAdmins((prev) => [...prev, { id: crypto.randomUUID(), email: "", password: "", fullName: "" }]);
  };

  const removeAdmin = (id: string) => {
    if (admins.length <= 1) return;
    setAdmins((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAdmin = (id: string, field: keyof AdminEntry, value: string) => {
    setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperuser || !name.trim()) return;
    const validAdmins = admins.filter((a) => a.email.trim() && a.password);
    if (validAdmins.length === 0) {
      toast.error(t("superuser.addAtLeastOneAdmin"));
      return;
    }
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Missing session");

      const functions = supabase.functions;
      functions.setAuth(token);
      const { data, error } = await functions.invoke("create-tenant", {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          name: name.trim(),
          admins: validAdmins.map((a) => ({
            email: a.email.trim().toLowerCase(),
            password: a.password,
            fullName: a.fullName.trim() || undefined,
          })),
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      toast.success(t("onboarding.tenantCreated"));
      navigate("/superuser/tenants");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create tenant");
    } finally {
      setLoading(false);
    }
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t("superuser.admins")}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAdmin}>
                  {t("superuser.addAnotherAdmin")}
                </Button>
              </div>
              {admins.map((admin) => (
                <div key={admin.id} className="rounded-md border p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">{t("superuser.admin")} #{admins.indexOf(admin) + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAdmin(admin.id)}
                      disabled={admins.length <= 1}
                    >
                      {t("common.delete")}
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    <div className="space-y-1">
                      <Label>{t("invites.email")}</Label>
                      <Input
                        type="email"
                        value={admin.email}
                        onChange={(e) => updateAdmin(admin.id, "email", e.target.value)}
                        placeholder="admin@example.com"
                        dir="ltr"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>{t("auth.password")}</Label>
                      <Input
                        type="password"
                        value={admin.password}
                        onChange={(e) => updateAdmin(admin.id, "password", e.target.value)}
                        placeholder="••••••••"
                        dir="ltr"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>{t("auth.fullName")} ({t("common.optional")})</Label>
                      <Input
                        value={admin.fullName}
                        onChange={(e) => updateAdmin(admin.id, "fullName", e.target.value)}
                        placeholder={t("auth.fullName")}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
              {loading ? t("onboarding.creating") : t("superuser.createTenant")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
