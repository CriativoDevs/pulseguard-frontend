import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LinkButton } from "./LinkButton";
import { useTheme } from "../theme";

const navItems = [
  { to: "/", labelKey: "servers" },
  { to: "/metrics", labelKey: "metrics" },
  { to: "/notifications", labelKey: "notifications" },
  { to: "/billing", labelKey: "billing" },
  { to: "/members", labelKey: "members" },
];

export const Layout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-semibold text-primary dark:text-primary-foreground">
              PulseGuard
            </Link>
            <nav className="hidden md:flex items-center gap-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? "underline underline-offset-4" : ""}`
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <select
              aria-label="language"
              className="bg-transparent text-sm border border-slate-200/70 dark:border-slate-700 rounded-lg px-2 py-1"
              value={i18n.resolvedLanguage}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              {[
                { code: "en", label: "EN" },
                { code: "pt", label: "PT" },
                { code: "pt-br", label: "PT-BR" },
                { code: "es", label: "ES" },
                { code: "fr", label: "FR" },
                { code: "it", label: "IT" },
                { code: "ig", label: "IG" },
              ].map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
            <LinkButton variant="ghost" onClick={toggle}>
              {theme === "dark" ? t("light") : t("dark")}
            </LinkButton>
            <LinkButton>{t("logout")}</LinkButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};
