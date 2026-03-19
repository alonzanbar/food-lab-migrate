import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { LogOut, Globe, FileText, Shield, Building2 } from "lucide-react";

export default function WorkerLayout() {
  const { signOut, user, role, isSuperuser } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar - mobile friendly */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" />
          <h1 className="text-lg font-bold font-display">{t("app.name")}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isSuperuser && (
            <button
              onClick={() => navigate("/superuser/tenants")}
              className="p-2 text-accent hover:text-foreground"
              title={t("superuser.title")}
            >
              <Building2 className="w-5 h-5" />
            </button>
          )}
          {role === "admin" && (
            <button
              onClick={() => navigate("/admin/forms")}
              className="p-2 text-accent hover:text-foreground"
              title={t("nav.admin")}
            >
              <Shield className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setLang(lang === "he" ? "en" : "he")}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            <Globe className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
