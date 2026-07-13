"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, MessageSquare, X, FileText, Trash2 } from "lucide-react";

interface Conversation {
  _id: string;
  title: string;
  createdAt: string;
  contextSummary?: string;
}

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const activeId = pathname.split("/chat/")[1]?.split("/")[0] || "";

  function loadConversations() {
    setLoading(true);
    fetch("/api/conversations")
      .then((res) => res.json())
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    loadConversations();
  }, [pathname]);

  async function handleNewChat() {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      const conv = await res.json();
      loadConversations();
      router.push(`/chat/${conv._id}`);
      onClose();
    } catch {
      // fallback
    }
  }

  async function handleClearAll() {
    if (clearing) return;
    if (!confirm("Delete all conversations? This cannot be undone.")) return;
    setClearing(true);
    try {
      await fetch("/api/conversations", { method: "DELETE" });
      setConversations([]);
      router.push("/chat");
      onClose();
    } catch {
      // fallback
    }
    setClearing(false);
  }

  const activeConv = conversations.find((c) => c._id === activeId);
  const hasSummary = !!activeConv?.contextSummary;

  const sidebar = (
    <aside className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:hidden">
        <span className="text-sm font-semibold text-white">Chats</span>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="glass flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-all hover:border-accent-cyan/50 hover:shadow-[0_0_12px_rgba(0,229,255,0.15)]"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {hasSummary && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-accent-cyan/5 px-3 py-2">
          <FileText size={14} className="shrink-0 text-accent-cyan" />
          <span className="text-xs text-accent-cyan/80 leading-relaxed">
            Long conversation — using summarized memory
          </span>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="flex flex-col gap-2 px-2 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-gray-500">
            No conversations yet
          </p>
        ) : null}
        {conversations.map((conv) => {
          const isActive = conv._id === activeId;
          return (
            <button
              key={conv._id}
              onClick={() => {
                router.push(`/chat/${conv._id}`);
                onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                isActive
                  ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30"
                  : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <MessageSquare size={16} className="shrink-0" />
              <span className="truncate">{conv.title}</span>
            </button>
          );
        })}
      </nav>

      {conversations.length > 0 && (
        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-40"
          >
            <Trash2 size={14} />
            {clearing ? "Clearing..." : "Clear all conversations"}
          </button>
        </div>
      )}
    </aside>
  );

  return (
    <>
      <div className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-white/10">
        {sidebar}
      </div>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="absolute left-0 top-0 h-full w-72 animate-slide-in glass border-r border-white/10">
            {sidebar}
          </div>
        </div>
      )}
    </>
  );
}
