import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Building2, Plus, LogOut, Globe, ArrowLeft } from "lucide-react";

export default function SuperuserLayout() {
  const { signOut, user, role, tenantId } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-row-reverse">
      <aside className="w-64 bg-card border-s border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold font-display text-foreground">{t("app.name")}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t("superuser.title")}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLink
            to="/superuser/tenants"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              }`
            }
          >
            <Building2 className="w-5 h-5" />
            {t("superuser.tenants")}
          </NavLink>
          <NavLink
            to="/superuser/tenants/create"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              }`
            }
          >
            <Plus className="w-5 h-5" />
            {t("superuser.createTenant")}
          </NavLink>
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => navigate(tenantId ? (role === "admin" ? "/admin/processes" : "/worker") : "/onboarding")}
          >
            <ArrowLeft className="w-4 h-4" />
            {t("superuser.backToApp")}
          </Button>
          <div className="text-xs text-muted-foreground truncate px-2">{user?.email}</div>
          <button
            onClick={() => setLang(lang === "he" ? "en" : "he")}
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground w-full"
          >
            <Globe className="w-4 h-4" />
            {lang === "he" ? "English" : "עברית"}
          </button>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            {t("common.logout")}
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
