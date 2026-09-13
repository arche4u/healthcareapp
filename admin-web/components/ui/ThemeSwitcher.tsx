"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Check, Sun, Moon, Monitor } from "lucide-react";

const COLOR_THEMES = [
  {
    id: "theme-blue",
    label: "Calm Blue",
    description: "Clear and focused",
    light: "#0EA5E9",
    dark: "#38BDF8",
    accent: "#BAE6FD",
  },
  {
    id: "theme-green",
    label: "Forest Green",
    description: "Natural and healing",
    light: "#16A34A",
    dark: "#4ADE80",
    accent: "#BBF7D0",
  },
  {
    id: "theme-purple",
    label: "Midnight Purple",
    description: "Elegant and calm",
    light: "#7C3AED",
    dark: "#A78BFA",
    accent: "#EDE9FE",
  },
  {
    id: "theme-amber",
    label: "Warm Amber",
    description: "Warm and welcoming",
    light: "#D97706",
    dark: "#FCD34D",
    accent: "#FEF3C7",
  },
];

const MODE_THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [colorTheme, setColorTheme] = useState<string>("theme-blue");

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("colorTheme") || "theme-blue";
    setColorTheme(saved);
    applyColorTheme(saved);
  }, []);

  const applyColorTheme = (themeId: string) => {
    const html = document.documentElement;
    COLOR_THEMES.forEach((t) => html.classList.remove(t.id));
    html.classList.add(themeId);
    localStorage.setItem("colorTheme", themeId);
  };

  const handleColorTheme = (themeId: string) => {
    setColorTheme(themeId);
    applyColorTheme(themeId);
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 w-14 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Color Themes */}
      <div>
        <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
          Color Theme
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {COLOR_THEMES.map((t) => {
            const isActive = colorTheme === t.id;
            const primaryColor = resolvedTheme === "dark" ? t.dark : t.light;
            return (
              <button
                key={t.id}
                onClick={() => handleColorTheme(t.id)}
                className={`relative group flex flex-col items-start gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                  isActive
                    ? "border-primary shadow-md shadow-primary/20 scale-105"
                    : "border-border hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                <div className="flex gap-1.5 items-center">
                  <div
                    className="h-6 w-6 rounded-full shadow-sm ring-2 ring-white/50"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div
                    className="h-4 w-4 rounded-full opacity-60"
                    style={{ backgroundColor: t.accent }}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {t.description}
                  </p>
                </div>
                {isActive && (
                  <div
                    className="absolute top-2 right-2 h-4 w-4 rounded-full flex items-center justify-center text-white text-[10px]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Check className="h-2.5 w-2.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Light / Dark / System mode */}
      <div>
        <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
          Display Mode
        </p>
        <div className="flex gap-3">
          {MODE_THEMES.map(({ id, label, icon: Icon }) => {
            const isActive = theme === id;
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-200 ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                />
                <span
                  className={`text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
