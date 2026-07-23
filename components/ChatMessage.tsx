"use client";

import { useState, useCallback, memo, useEffect } from "react";
import { Bot, User, RefreshCw, Volume2, VolumeX, FileText, Image as ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/hooks/useChat";

interface FileAttachment {
  filename: string;
  type: "image" | "text" | "other";
  content: string;
}

function parseContent(content: string): { text: string; files: FileAttachment[] } {
  const files: FileAttachment[] = [];
  const lines = content.split("\n");
  const textLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(/^--- (.+) ---$/);
    if (match) {
      const filename = match[1];
      i++;
      let fileContent = "";
      while (i < lines.length && !lines[i].startsWith("--- ")) {
        fileContent += lines[i] + "\n";
        i++;
      }
      const isImage = filename.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
      files.push({
        filename,
        type: isImage ? "image" : "text",
        content: fileContent.trim(),
      });
    } else {
      textLines.push(line);
      i++;
    }
  }

  return { text: textLines.join("\n").trim(), files };
}

interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
}

export default memo(function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const [speaking, setSpeaking] = useState(false);
  const { role, content, status } = message;
  const isUser = role === "user";
  const isStreaming = status === "streaming";
  const isError = status === "error";

  const { text, files } = !isUser && !isError ? parseContent(content) : { text: content, files: [] };

  useEffect(() => {
    if (typeof window !== "undefined" && speechSynthesis.getVoices().length === 0) {
      speechSynthesis.getVoices();
    }
  }, []);

  const getVoice = useCallback(() => {
    const voices = speechSynthesis.getVoices();
    return voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google"))
      || voices.find((v) => v.lang.startsWith("en") && v.name.includes("Microsoft"))
      || voices.find((v) => v.lang.startsWith("en-US"))
      || voices.find((v) => v.lang.startsWith("en"))
      || null;
  }, []);

  const toggleSpeak = useCallback(() => {
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    const voice = getVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    speechSynthesis.speak(utterance);
  }, [speaking, content, getVoice]);

  return (
    <div
      className={`flex items-start gap-3 animate-fade-in ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-accent-primary/10 text-accent-primary"
            : "bg-surface text-text-secondary"
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className="max-w-[80%] space-y-1">
        <div
          className={`rounded-2xl px-4 py-3 leading-relaxed ${
            isUser
              ? "bg-user-bubble rounded-tr-md"
              : isError
                ? "glass rounded-tl-md border border-red-500/30"
                : "glass rounded-tl-md"
          }`}
        >
          {isUser ? (
            <p className="text-sm text-text-primary">{content}</p>
          ) : isError ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-red-400">{content || "Failed to generate response"}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex w-fit items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              )}
            </div>
          ) : isStreaming && !content ? (
            <div className="flex items-center gap-1 py-1">
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-accent-primary" style={{ animationDelay: "0s" }} />
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-accent-primary" style={{ animationDelay: "0.2s" }} />
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-accent-primary" style={{ animationDelay: "0.4s" }} />
            </div>
          ) : (
            <div>
              {files.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-text-secondary"
                    >
                      {f.type === "image" ? <ImageIcon size={12} /> : <FileText size={12} />}
                      <span className="max-w-[160px] truncate">{f.filename}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="prose prose-invert prose-sm max-w-none text-text-primary">
                {isStreaming ? (
                  <span className="whitespace-pre-wrap">{text || content}</span>
                ) : (
                  <ReactMarkdown>{text || content}</ReactMarkdown>
                )}
                {isStreaming && content && (
                  <span className="inline-block h-4 w-0.5 animate-pulse bg-accent-primary ml-0.5 align-text-bottom" />
                )}
              </div>
            </div>
          )}
        </div>

        {!isUser && !isStreaming && !isError && text && (
          <button
            onClick={toggleSpeak}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-all ${
              speaking
                ? "bg-accent-primary/10 text-accent-primary"
                : "text-text-muted hover:bg-white/5 hover:text-text-secondary"
            }`}
          >
            {speaking ? <Volume2 size={13} className="animate-pulse" /> : <VolumeX size={13} />}
            <span>{speaking ? "Speaking..." : "Read aloud"}</span>
          </button>
        )}
      </div>
    </div>
  );
});
