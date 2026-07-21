"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import PromptSuggestions from "@/components/PromptSuggestions";

export default function ChatIndexPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  async function handlePrompt(text: string) {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: text.slice(0, 60) }),
      });
      const conv = await res.json();
      if (!conv?._id) return;
      router.push(`/chat/${conv._id}`);
    } catch {
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-3 top-20 z-30 rounded-xl border border-border bg-surface p-2.5 text-text-muted hover:text-text-primary md:hidden"
      >
        <Menu size={20} />
      </button>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-text-primary">AI Chat Assistant</h2>
          <p className="mt-1 text-sm text-text-muted">
            Select a conversation or start a new chat
          </p>
        </div>
        <PromptSuggestions onSelect={handlePrompt} />
      </main>
    </div>
  );
}
