import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const [params] = useSearchParams();
  const redirectTo = params.get("redirect") || "/";
  const navigate = useNavigate();
  const { signIn, signUp, signInWithMagicLink } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [isSignUp, setIsSignUp] = useState(false);
  const isInviteFlow = redirectTo.includes("/onboarding/accept");
  const [isMagicLink, setIsMagicLink] = useState(isInviteFlow);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isMagicLink) {
        const fullRedirect = `${window.location.origin}${redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`}`;
        const { error } = await signInWithMagicLink(email, fullRedirect);
        if (error) throw error;
        toast.success(t("auth.magicLinkSent"));
        setIsMagicLink(false);
      } else if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast.success(t("auth.signupSuccess"));
        navigate(redirectTo, { replace: true });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate(redirectTo, { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-display text-foreground">
            {t("auth.welcomeTitle")}
          </h1>
          <p className="text-muted-foreground">{t("auth.welcomeSubtitle")}</p>
        </div>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle>
              {isMagicLink ? t("auth.magicLink") : isSignUp ? t("auth.signupButton") : t("auth.login")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isInviteFlow && !isSignUp && !isMagicLink && (
                <p className="text-sm text-muted-foreground">{t("auth.magicLinkDesc")}</p>
              )}
              {isSignUp && !isMagicLink && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>
              {!isMagicLink && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required={!isMagicLink}
                    dir="ltr"
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? isMagicLink ? t("common.loading") : isSignUp ? t("auth.signingUp") : t("auth.signingIn")
                  : isMagicLink ? t("auth.magicLink") : isSignUp ? t("auth.signupButton") : t("auth.loginButton")}
              </Button>
            </form>
            <div className="mt-4 space-y-2 text-center">
              {isInviteFlow && !isSignUp && (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsMagicLink(!isMagicLink)}
                    className="text-sm text-accent hover:underline"
                  >
                    {isMagicLink ? t("auth.usePassword") : t("auth.magicLink")}
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setIsMagicLink(false); }}
                className="text-sm text-accent hover:underline block"
              >
                {isSignUp ? t("auth.hasAccount") : t("auth.noAccount")}
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setLang(lang === "he" ? "en" : "he")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {lang === "he" ? "English" : "עברית"}
          </button>
        </div>
      </div>
    </div>
  );
}
