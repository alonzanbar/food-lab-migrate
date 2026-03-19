import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { FileText, BarChart3, LogOut, Globe, Users } from "lucide-react";

export default function AdminLayout() {
  const { signOut, user } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const navItems = [
    { to: "/admin/forms", label: t("nav.forms"), icon: FileText },
    { to: "/admin/reports", label: t("nav.reports"), icon: BarChart3 },
    { to: "/admin/invites", label: "Invites", icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-row-reverse">
      {/* Sidebar - right side for RTL */}
      <aside className="w-64 bg-card border-s border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold font-display text-foreground">{t("app.name")}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t("nav.admin")}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
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

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
