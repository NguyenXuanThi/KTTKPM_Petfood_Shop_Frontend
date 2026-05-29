﻿import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LANGUAGES = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "jp", label: "日本語", flag: "🇯🇵" },
];

const normalizeLanguage = (value?: string) => {
  const language = (value || "vi").toLowerCase();
  if (language.startsWith("vi")) return "vi";
  if (language.startsWith("en")) return "en";
  if (language.startsWith("ja") || language.startsWith("jp")) return "jp";
  return "vi";
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const normalizedLanguage = normalizeLanguage(
    i18n.resolvedLanguage || i18n.language,
  );
  const current =
    LANGUAGES.find((language) => language.code === normalizedLanguage) ??
    LANGUAGES[0];

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative z-50">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        aria-label="Change language"
      >
        <Globe size={18} />
        <span className="hidden text-xs font-medium sm:inline">
          {current.flag}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 top-full z-[100] mt-2 w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-xl dark:border-gray-800 dark:bg-gray-900"
          >
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={async () => {
                  localStorage.setItem("i18nextLng", language.code);
                  await i18n.changeLanguage(language.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  normalizedLanguage === language.code
                    ? "font-semibold text-amber-500"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <span className="text-base">{language.flag}</span>
                {language.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
