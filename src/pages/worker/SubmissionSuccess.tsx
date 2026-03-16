import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function SubmissionSuccess() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 py-12">
      <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-success" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold font-display">{t("worker.submissionSuccess")}</h2>
        <p className="text-muted-foreground">{t("worker.submissionSuccessDesc")}</p>
      </div>
      <div className="space-y-3 w-full max-w-xs">
        <Button onClick={() => navigate("/worker")} className="w-full h-14 text-lg">
          {t("worker.backToForms")}
        </Button>
      </div>
    </div>
  );
}
