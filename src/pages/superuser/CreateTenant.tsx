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

export default function CreateTenant() {
  const { isSuperuser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperuser || !name.trim()) return;
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Missing session");

      const functions = supabase.functions;
      functions.setAuth(token);
      const { data, error } = await functions.invoke("create-tenant", {
        headers: { Authorization: `Bearer ${token}` },
        body: { name: name.trim() },
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
            <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
              {loading ? t("onboarding.creating") : t("superuser.createTenant")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
