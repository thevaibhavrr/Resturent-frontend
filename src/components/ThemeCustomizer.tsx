import { Palette } from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

export const colorThemes = [
  {
    name: "Ocean Blue",
    id: "ocean",
    colors: {
      primary: "#0891b2",
      secondary: "#06b6d4",
      accent: "#e0f2fe",
      background: "#f0f9ff",
      foreground: "#0c4a6e",
      card: "#ffffff",
      muted: "#e0f2fe",
      border: "#67e8f9",
    },
  },
  {
    name: "Sunset Orange",
    id: "sunset",
    colors: {
      primary: "#ea580c",
      secondary: "#fb923c",
      accent: "#ffedd5",
      background: "#fff7ed",
      foreground: "#7c2d12",
      card: "#ffffff",
      muted: "#fed7aa",
      border: "#fdba74",
    },
  },
  {
    name: "Forest Green",
    id: "forest",
    colors: {
      primary: "#15803d",
      secondary: "#22c55e",
      accent: "#dcfce7",
      background: "#f0fdf4",
      foreground: "#14532d",
      card: "#ffffff",
      muted: "#bbf7d0",
      border: "#86efac",
    },
  },
  {
    name: "Royal Purple",
    id: "royal",
    colors: {
      primary: "#7c3aed",
      secondary: "#a78bfa",
      accent: "#ede9fe",
      background: "#faf5ff",
      foreground: "#3b0764",
      card: "#ffffff",
      muted: "#ddd6fe",
      border: "#c4b5fd",
    },
  },
  {
    name: "Cherry Red",
    id: "cherry",
    colors: {
      primary: "#dc2626",
      secondary: "#f87171",
      accent: "#fee2e2",
      background: "#fef2f2",
      foreground: "#7f1d1d",
      card: "#ffffff",
      muted: "#fecaca",
      border: "#fca5a5",
    },
  },
  {
    name: "Midnight Dark",
    id: "midnight",
    colors: {
      primary: "#f8fafc",
      secondary: "#475569",
      accent: "#334155",
      background: "#0f172a",
      foreground: "#f8fafc",
      card: "#1e293b",
      muted: "#334155",
      border: "#475569",
    },
  },
  {
    name: "Rose Gold",
    id: "rose",
    colors: {
      primary: "#be185d",
      secondary: "#ec4899",
      accent: "#fce7f3",
      background: "#fdf2f8",
      foreground: "#831843",
      card: "#ffffff",
      muted: "#fbcfe8",
      border: "#f9a8d4",
    },
  },
  {
    name: "Sky Blue",
    id: "sky",
    colors: {
      primary: "#0284c7",
      secondary: "#38bdf8",
      accent: "#e0f2fe",
      background: "#faf9f6",
      foreground: "#0c4a6e",
      card: "#ffffff",
      muted: "#e0f2fe",
      border: "#7dd3fc",
    },
  },
];

interface ThemeCustomizerProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

export function ThemeCustomizer({
  currentTheme,
  onThemeChange,
}: ThemeCustomizerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed top-4 right-4 z-50 shadow-lg">
          <Palette className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Customize Theme</SheetTitle>
          <SheetDescription>
            Choose from 8 different color themes to personalize your experience
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {colorThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                currentTheme === theme.id
                  ? "border-primary shadow-md"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span>{theme.name}</span>
                {currentTheme === theme.id && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <div className="flex gap-2">
                <div
                  className="w-8 h-8 rounded-md border shadow-sm"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="w-8 h-8 rounded-md border shadow-sm"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
                <div
                  className="w-8 h-8 rounded-md border shadow-sm"
                  style={{ backgroundColor: theme.colors.accent }}
                />
                <div
                  className="w-8 h-8 rounded-md border shadow-sm"
                  style={{ backgroundColor: theme.colors.background }}
                />
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
