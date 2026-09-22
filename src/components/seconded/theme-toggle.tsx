import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "seconded-theme";
const THEME_CHANGE_EVENT = "seconded-theme-change";

function getActiveTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: theme }));
}

export function ThemeToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const syncTheme = (event?: Event) => {
      const nextTheme = event instanceof CustomEvent && (event.detail === "light" || event.detail === "dark")
        ? event.detail
        : getActiveTheme();
      setTheme(nextTheme);
    };
    syncTheme();
    window.addEventListener(THEME_CHANGE_EVENT, syncTheme);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
  }, []);

  const isDark = theme === "dark";
  const label = isDark ? "Dark Mode" : "Light Mode";
  const nextLabel = isDark ? "Light Mode" : "Dark Mode";

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      className={cn(showLabel && "w-full justify-start", className)}
      aria-label={`${label}. Switch to ${nextLabel}`}
      title={`${label} — switch to ${nextLabel}`}
      onClick={() => {
        const nextTheme: Theme = getActiveTheme() === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }}
    >
      <span className="relative grid size-4 place-items-center" aria-hidden>
        <Sun className={cn("absolute size-4 transition-all duration-200", isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100")} />
        <Moon className={cn("absolute size-4 transition-all duration-200", isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0")} />
      </span>
      {showLabel && <span>{theme === null ? "Theme" : label}</span>}
      <span className="sr-only">{label}</span>
    </Button>
  );
}