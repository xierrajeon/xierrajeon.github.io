"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_LANG, translate, type DictKey } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export const LANG_STORAGE_KEY = "xj-lang";
export const THEME_STORAGE_KEY = "xj-theme";

export type Theme = "light" | "dark";

interface AppContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  /** Translate a UI chrome string. Content strings come from the database. */
  t: (key: DictKey) => string;
  theme: Theme;
  toggleTheme: () => void;
  /** False until the client has read localStorage; used to avoid flashes. */
  ready: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

/**
 * Both values are rendered at their defaults during the static build and
 * corrected after mount. Reading localStorage during render would produce a
 * hydration mismatch, so the stored preference is applied in an effect — the
 * inline script in layout.tsx handles the theme before first paint so only the
 * language can briefly differ.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  const [theme, setThemeState] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Reading localStorage
       during render would make the server-rendered HTML and the first client
       render disagree. Correcting it once, after hydration, is the point of
       this effect; it is a single settle, not a cascade. */
    try {
      const storedLang = localStorage.getItem(LANG_STORAGE_KEY);
      if (storedLang === "ko" || storedLang === "en") setLangState(storedLang);

      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === "light" || storedTheme === "dark") {
        setThemeState(storedTheme);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setThemeState("dark");
      }
    } catch {
      // Private browsing can throw on localStorage access; defaults are fine.
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "ko" ? "en" : "ko");
  }, [lang, setLang]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const value = useMemo<AppContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang,
      t: (key: DictKey) => translate(lang, key),
      theme,
      toggleTheme,
      ready,
    }),
    [lang, setLang, toggleLang, theme, toggleTheme, ready],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProviders>");
  return ctx;
}

/** Convenience for components that only need the language and translator. */
export function useLang() {
  const { lang, t } = useApp();
  return { lang, t };
}
