import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

type Theme = "dark" | "light";

// Convert hex color to HSL string "H S% L%"
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Darken HSL string by reducing lightness
function darkenHsl(hsl: string, amount: number): string {
  const parts = hsl.split(" ");
  const h = parts[0];
  const s = parts[1];
  const l = parseFloat(parts[2]);
  return `${h} ${s} ${Math.max(0, l - amount)}%`;
}

const DEFAULT_ACCENT = "#10b981"; // emerald-500 (the original green)

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  accentColor: string;
  setAccentColor: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyAccent(hex: string, theme: Theme) {
  const root = document.documentElement;
  const hsl = hexToHsl(hex);
  const darkHsl = darkenHsl(hsl, 8);

  const primaryHsl = theme === "light" ? darkHsl : hsl;
  const fgHsl = theme === "light" ? "0 0% 100%" : "220 16% 8%";

  root.style.setProperty("--primary", primaryHsl);
  root.style.setProperty("--primary-foreground", fgHsl);
  root.style.setProperty("--ring", primaryHsl);
  root.style.setProperty("--sidebar-primary", primaryHsl);
  root.style.setProperty("--sidebar-primary-foreground", fgHsl);
  root.style.setProperty("--sidebar-ring", primaryHsl);
  root.style.setProperty("--tag-foreground", primaryHsl);
  root.style.setProperty("--vote-up", primaryHsl);
  root.style.setProperty("--accent", primaryHsl);
  root.style.setProperty("--accent-foreground", fgHsl);
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) ?? "dark";
  });

  const [accentColor, setAccentColorState] = useState<string>(() => {
    return localStorage.getItem("accentColor") ?? DEFAULT_ACCENT;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("theme", theme);
    applyAccent(accentColor, theme);
  }, [theme, accentColor]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const setAccentColor = useCallback((hex: string) => {
    setAccentColorState(hex);
    localStorage.setItem("accentColor", hex);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
