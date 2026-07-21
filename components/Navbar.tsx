"use client";

import { UserButton } from "@clerk/nextjs";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-6 py-3">
      <span className="text-lg font-semibold text-text-primary">Chatbot</span>
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "h-9 w-9",
              userButtonPopoverCard: {
                backgroundColor: isDark ? "#181b21" : "#ffffff",
                border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.08)",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              },
              userButtonPopoverActionButton: {
                color: isDark ? "#f0f1f3" : "#171717",
                padding: "0.5rem 1rem",
              },
              userButtonPopoverActionButtonText: {
                color: isDark ? "#f0f1f3" : "#171717",
              },
            },
          }}
        />
      </div>
    </nav>
  );
}
