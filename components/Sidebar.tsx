"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Plus, MessageSquare, X, FileText, Trash2 } from "lucide-react";
import { connectSocket, getSocket } from "@/lib/socket-client";

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

  function loadConversations(background?: boolean) {
    if (!background) setLoading(true);
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        setConversations(Array.isArray(data) ? data : []);
      })
      .catch(() => setConversations([]))
      .finally(() => { if (!background) setLoading(false); });
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    loadConversations(true);
  }, [pathname]);

  const { getToken } = useAuth();

  useEffect(() => {
    let cancelled = false;
    connectSocket(getToken).then(() => {
      if (cancelled) return;
      const socket = getSocket();
      if (!socket) return;
      const handler = () => {
        if (!cancelled) loadConversations(true);
      };
      socket.on("conversation:updated", handler);
    });
    return () => { cancelled = true; };
  }, [getToken]);

  useEffect(() => {
    const interval = setInterval(() => loadConversations(true), 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleNewChat() {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      const conv = await res.json();
      if (!conv?._id) return;
      loadConversations();
      router.push(`/chat/${conv._id}`);
      onClose();
    } catch {
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
    }
    setClearing(false);
  }

  const activeConv = conversations.find((c) => c._id === activeId);
  const hasSummary = !!activeConv?.contextSummary;

  const sidebar = (
    <aside className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
        <span className="text-sm font-semibold text-text-primary">Chats</span>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-text-muted hover:bg-white/5 hover:text-text-primary"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-all hover:bg-surface-hover"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {hasSummary && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-accent-primary/5 px-3 py-2">
          <FileText size={14} className="shrink-0 text-accent-primary" />
          <span className="text-xs text-accent-primary/70 leading-relaxed">
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
          <p className="px-2 py-8 text-center text-sm text-text-muted">
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
                  ? "bg-accent-primary/10 text-accent-primary"
                  : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
              }`}
            >
              <MessageSquare size={16} className="shrink-0" />
              <span className="truncate">{conv.title}</span>
            </button>
          );
        })}
      </nav>

      {conversations.length > 0 && (
        <div className="border-t border-border p-3">
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
      <div className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border">
        {sidebar}
      </div>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="absolute left-0 top-0 h-full w-72 animate-slide-in border-r border-border bg-surface">
            {sidebar}
          </div>
        </div>
      )}
    </>
  );
}
