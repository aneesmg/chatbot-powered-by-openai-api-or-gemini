"use client";

import { useState, useCallback, memo } from "react";
import { Bot, User, RefreshCw, Volume2, VolumeX, FileText, Image as ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/hooks/useChat";

interface FileAttachment {
  filename: string;
  type: "image" | "text" | "other";
  content: string;
}

// Messages may have file context appended; display it cleanly
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

  const toggleSpeak = useCallback(() => {
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    speechSynthesis.speak(utterance);
  }, [speaking, content]);

  return (
    <div
      className={`flex items-start gap-3 animate-fade-in ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-accent-purple/20 text-accent-purple"
            : "bg-accent-cyan/20 text-accent-cyan"
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className="max-w-[80%] space-y-1">
        <div
          className={`rounded-2xl px-4 py-3 leading-relaxed ${
            isUser
              ? "bg-accent-purple/10 rounded-tr-md"
              : isError
                ? "glass rounded-tl-md border-red-500/40"
                : "glass rounded-tl-md border-accent-cyan/20"
          }`}
        >
          {isUser ? (
            <p className="text-sm text-white">{content}</p>
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
              <span className="h-2 w-2 animate-bounce rounded-full bg-accent-cyan" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-accent-cyan" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-accent-cyan" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <div>
              {files.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-gray-400"
                    >
                      {f.type === "image" ? <ImageIcon size={12} /> : <FileText size={12} />}
                      <span className="max-w-[160px] truncate">{f.filename}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="prose prose-invert prose-sm max-w-none text-gray-200">
                {isStreaming ? (
                  <span className="whitespace-pre-wrap">{text || content}</span>
                ) : (
                  <ReactMarkdown>{text || content}</ReactMarkdown>
                )}
                {isStreaming && content && (
                  <span className="inline-block h-4 w-1.5 animate-pulse bg-accent-cyan ml-0.5 align-text-bottom" />
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
                ? "bg-accent-cyan/15 text-accent-cyan shadow-[0_0_8px_rgba(0,229,255,0.15)]"
                : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
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
