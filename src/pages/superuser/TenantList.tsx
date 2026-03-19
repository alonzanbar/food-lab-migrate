import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Plus, Eye } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  status: string;
  created_at: string | null;
  created_by: string | null;
}

export default function TenantList() {
  const { isSuperuser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSuperuser) {
      navigate("/");
      return;
    }
    const fetch = async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, status, created_at, created_by")
        .order("created_at", { ascending: false });
      if (error) {
        console.error(error);
        return;
      }
      setTenants((data as Tenant[]) || []);
      setLoading(false);
    };
    fetch();
  }, [isSuperuser, navigate]);

  if (!isSuperuser) return null;

  if (loading) return <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display">{t("superuser.tenants")}</h2>
        <Button onClick={() => navigate("/superuser/tenants/create")} className="gap-2">
          <Plus className="w-4 h-4" />
          {t("superuser.createTenant")}
        </Button>
      </div>

      {tenants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">{t("superuser.noTenants")}</p>
            <Button className="mt-4" onClick={() => navigate("/superuser/tenants/create")}>
              {t("superuser.createTenant")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-start p-4 text-sm font-medium text-muted-foreground">{t("common.name")}</th>
                <th className="text-start p-4 text-sm font-medium text-muted-foreground">{t("common.status")}</th>
                <th className="text-start p-4 text-sm font-medium text-muted-foreground">{t("superuser.createdAt")}</th>
                <th className="text-start p-4 text-sm font-medium text-muted-foreground">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{tenant.name}</td>
                  <td className="p-4">
                    <span className={tenant.status === "active" ? "status-active" : "status-inactive"}>
                      {tenant.status === "active" ? t("forms.active") : t("forms.inactive")}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm" dir="ltr">
                    {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString("he-IL") : "-"}
                  </td>
                  <td className="p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/superuser/tenants/${tenant.id}`)}
                    >
                      <Eye className="w-4 h-4 me-1" />
                      {t("superuser.viewDetails")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
