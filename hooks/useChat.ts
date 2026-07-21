"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { connectSocket, disconnectSocket, joinConversation, leaveConversation, getSocket } from "@/lib/socket-client";

export interface Message {
  _id?: string;
  role: "user" | "assistant";
  content: string;
  status?: "sent" | "streaming" | "error" | "done";
}

interface FileAttachment {
  filename: string;
  type: "image" | "text" | "other";
  content: string;
}

interface UseChatReturn {
  messages: Message[];
  loaded: boolean;
  isStreaming: boolean;
  isAITyping: boolean;
  sendMessage: (text: string, files?: FileAttachment[]) => void;
  cancel: () => void;
  retry: () => void;
}

let tempCounter = 0;
function tempId() {
  return `temp-${++tempCounter}`;
}

export function useChat(conversationId: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const userTextRef = useRef<string>("");
  const messagesRef = useRef<Message[]>([]);
  const { getToken } = useAuth();

  messagesRef.current = messages;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/messages?conversationId=${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            const loaded: Message[] = Array.isArray(data)
              ? data.map((m) => ({ ...m, status: "done" as const }))
              : [];
            setMessages(loaded);
          }
        }
      } catch {
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [conversationId]);

  useEffect(() => {
    let cancelled = false;

    async function initSocket() {
      try {
        const socket = await connectSocket(getToken);

        if (cancelled) return;

        joinConversation(conversationId);

        socket.on("message:new", (message: Message) => {
          if (cancelled) return;
          setMessages((prev) => {
            const exact = prev.find((m) => m._id === message._id);
            if (exact) return prev;

            const pending = prev.find(
              (m) => m.role === message.role && m._id?.startsWith("temp-")
            );
            if (pending) {
              return prev.map((m) =>
                m._id === pending._id
                  ? { ...m, _id: message._id }
                  : m
              );
            }

            return [...prev, { ...message, status: "done" }];
          });
        });
      } catch {
      }
    }

    initSocket();

    return () => {
      cancelled = true;
      leaveConversation(conversationId);
    };
  }, [conversationId, getToken]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  const sendMessage = useCallback(
    (text: string, files?: FileAttachment[]) => {
      const userTempId = tempId();
      const assistantTempId = tempId();
      userTextRef.current = text;

      const userMsg: Message = {
        _id: userTempId,
        role: "user",
        content: text,
        status: "sent",
      };

      const placeholder: Message = {
        _id: assistantTempId,
        role: "assistant",
        content: "",
        status: "streaming",
      };

      setMessages((prev) => [...prev, userMsg, placeholder]);
      setIsAITyping(true);

      const controller = new AbortController();
      abortRef.current = controller;

      (async () => {
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId, message: text }),
            signal: controller.signal,
          });

          if (!res.ok) {
            let errorMsg = `API error: ${res.status}`;
            try {
              const errData = await res.json();
              if (errData.error) errorMsg = errData.error;
            } catch {}
            throw new Error(errorMsg);
          }

          const reader = res.body?.getReader();
          if (!reader) throw new Error("No response body");

          const decoder = new TextDecoder();
          let accumulated = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            accumulated += chunk;

            setMessages((prev) =>
              prev.map((m) =>
                m._id === assistantTempId
                  ? { ...m, content: accumulated, status: "streaming" }
                  : m
              )
            );
          }

          setMessages((prev) =>
            prev.map((m) =>
              m._id === assistantTempId
                ? { ...m, content: accumulated, status: "done" }
                : m
            )
          );

          setMessages((prev) =>
            prev.map((m) =>
              m._id === userTempId ? { ...m, status: "done" } : m
            )
          );
        } catch (err: unknown) {
          if (err instanceof DOMException && err.name === "AbortError") {
            setMessages((prev) =>
              prev.map((m) =>
                m._id === assistantTempId
                  ? { ...m, status: "done" }
                  : m._id === userTempId
                    ? { ...m, status: "done" }
                    : m
              )
            );
            return;
          }

          const errorMessage =
            err instanceof Error ? err.message : "Failed to generate response";

          setMessages((prev) =>
            prev.map((m) =>
              m._id === assistantTempId
                ? { ...m, status: "error", content: errorMessage }
                : m
            )
          );
        } finally {
          setIsAITyping(false);
          if (abortRef.current === controller) {
            abortRef.current = null;
          }
        }
      })();
    },
    [conversationId]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsAITyping(false);
  }, []);

  const retry = useCallback(() => {
    const prev = messagesRef.current;
    let lastUser: Message | undefined;
    let errorIdx = -1;

    for (let i = prev.length - 1; i >= 0; i--) {
      const m = prev[i];
      if (m.role === "assistant" && m.status === "error" && errorIdx === -1) {
        errorIdx = i;
      }
      if (m.role === "user" && m.status !== "error" && !lastUser) {
        lastUser = m;
      }
    }

    if (errorIdx !== -1) {
      setMessages(prev.slice(0, errorIdx));
    }

    if (lastUser) {
      sendMessage(lastUser.content);
    }
  }, [sendMessage]);

  const isStreaming = messages.some((m) => m.status === "streaming");

  return { messages, loaded, isStreaming, isAITyping, sendMessage, cancel, retry };
}
