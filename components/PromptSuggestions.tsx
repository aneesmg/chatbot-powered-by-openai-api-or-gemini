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
            className="group glass rounded-2xl border border-transparent p-4 text-left transition-all hover:border-accent-cyan/30 hover:shadow-[0_0_20px_rgba(0,229,255,0.08)]"
          >
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-accent-cyan/10 text-accent-cyan">
              <Icon size={16} />
            </div>
            <p className="text-sm font-medium text-white group-hover:text-accent-cyan">
              {s.title}
            </p>
            <p className="mt-1 text-xs text-gray-500">{s.text}</p>
          </button>
        );
      })}
    </div>
  );
}
