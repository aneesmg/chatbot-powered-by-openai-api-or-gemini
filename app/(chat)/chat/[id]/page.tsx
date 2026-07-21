"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Menu, Trash2 } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import Sidebar from "@/components/Sidebar";
import SkeletonLoader from "@/components/SkeletonLoader";

export default function ChatConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || id === "undefined" || id.length < 10) {
      router.replace("/chat");
    }
  }, [id, router]);

  const { messages, loaded, isStreaming, isAITyping, sendMessage, cancel, retry } = useChat(id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: isStreaming ? "auto" : "smooth" });
  }, [messages, isStreaming]);

  async function handleDelete() {
    if (!confirm("Delete this conversation? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await fetch(`/api/conversations?conversationId=${id}`, { method: "DELETE" });
      router.push("/chat");
    } catch {
    }
    setDeleting(false);
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

      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <button
            onClick={() => router.push("/chat")}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
          >
            <Trash2 size={14} />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!loaded ? (
            <SkeletonLoader />
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-text-muted">Start a conversation by sending a message below.</p>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg._id}
                  message={msg}
                  onRetry={msg.status === "error" ? retry : undefined}
                />
              ))}
              {isAITyping && !isStreaming && (
                <div className="flex items-center gap-2 px-1 py-2 text-sm text-text-muted">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent-primary" style={{ animationDelay: "0s" }} />
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent-primary" style={{ animationDelay: "0.2s" }} />
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent-primary" style={{ animationDelay: "0.4s" }} />
                  </span>
                  AI is thinking...
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border px-4 py-3">
          <ChatInput
            onSend={sendMessage}
            onCancel={cancel}
            isStreaming={isStreaming}
          />
        </div>
      </main>
    </div>
  );
}
