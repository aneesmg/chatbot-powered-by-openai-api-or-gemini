"use client";

import { Sparkles, Code, Database, FileText } from "lucide-react";

const SUGGESTIONS = [
  {
    icon: Sparkles,
    title: "Explain concepts",
    text: "Explain quantum computing in simple terms",
  },
  {
    icon: Code,
    title: "Write code",
    text: "Write a Python script to analyze a CSV file",
  },
  {
    icon: Database,
    title: "Compare technologies",
    text: "Key differences between SQL and NoSQL databases",
  },
  {
    icon: FileText,
    title: "Draft content",
    text: "Help me draft a professional follow-up email",
  },
];

export default function PromptSuggestions({
  onSelect,
}: {
  onSelect: (text: string) => void;
}) {
  return (
    <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
      {SUGGESTIONS.map((s) => {
        const Icon = s.icon;
        return (
          <button
            key={s.text}
            onClick={() => onSelect(s.text)}
            className="group rounded-2xl border border-border bg-surface p-4 text-left transition-all hover:bg-surface-hover hover:border-accent-primary/30"
          >
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
              <Icon size={16} />
            </div>
            <p className="text-sm font-medium text-text-primary group-hover:text-accent-primary">
              {s.title}
            </p>
            <p className="mt-1 text-xs text-text-muted">{s.text}</p>
          </button>
        );
      })}
    </div>
  );
}
