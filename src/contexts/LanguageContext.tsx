import React, { createContext, useContext, useState, useCallback, useLayoutEffect } from "react";
import { Language, TranslationKey, t as translate } from "@/i18n/translations";

const LANG_STORAGE_KEY = "ffd.lang.v1";

function readStoredLanguage(): Language {
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY);
    if (raw === "he" || raw === "en") return raw;
  } catch {
    /* private mode / unavailable */
  }
  return "he";
}

function applyDocumentLanguage(next: Language) {
  document.documentElement.lang = next;
  document.documentElement.dir = next === "he" ? "rtl" : "ltr";
}

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => readStoredLanguage());

  useLayoutEffect(() => {
    applyDocumentLanguage(lang);
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, newLang);
    } catch {
      /* quota / private mode */
    }
  }, []);

  const t = useCallback((key: TranslationKey) => translate(key, lang), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
