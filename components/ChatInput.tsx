"use client";

import { useState, useRef, useEffect, KeyboardEvent, useCallback } from "react";
import { Send, Square, Mic, Paperclip, Camera, X, Image as ImageIcon } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import PermissionModal from "@/components/PermissionModal";

interface FileAttachment {
  filename: string;
  type: "image" | "text" | "other";
  content: string;
}

interface ChatInputProps {
  onSend: (message: string, files?: FileAttachment[]) => void;
  onCancel?: () => void;
  isStreaming?: boolean;
}

async function uploadFile(file: File): Promise<FileAttachment> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export default function ChatInput({ onSend, onCancel, isStreaming }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  } = useVoiceInput();

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, [value]);

  useEffect(() => {
    if (transcript) setValue(transcript);
  }, [transcript]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    try {
      const results = await Promise.allSettled(
        Array.from(files).map((f) => uploadFile(f))
      );
      const newAttachments: FileAttachment[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") newAttachments.push(r.value);
      }
      setAttachments((prev) => [...prev, ...newAttachments]);
    } finally {
      setUploading(false);
    }
  }, []);

  function handleSend() {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || isStreaming) return;
    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setValue("");
    setAttachments([]);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleMicToggle() {
    if (isListening) stopListening();
    else startListening();
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCamera(true);
    } catch {
      setShowPermissionModal(true);
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
        await processFiles([file]);
      }
      closeCamera();
    }, "image/jpeg");
  }

  function closeCamera() {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    setShowCamera(false);
  }

  const fileIcon = (type: string) => {
    if (type === "image") return <ImageIcon size={12} />;
    return <Paperclip size={12} />;
  };

  useEffect(() => {
    if (error) {
      setShowPermissionModal(true);
    }
  }, [error]);

  return (
    <>
      <PermissionModal open={showPermissionModal} onClose={() => setShowPermissionModal(false)} />

      {/* Camera overlay */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} className="w-full" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <button
                onClick={capturePhoto}
                className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-black/50 text-white"
              >
                <span className="h-3 w-3 rounded-full bg-white" />
              </button>
              <button
                onClick={closeCamera}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass mx-auto mb-4 flex w-full max-w-3xl flex-col rounded-2xl px-4 py-3">
        {/* File attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-gray-300"
              >
                {fileIcon(att.type)}
                <span className="max-w-[120px] truncate">{att.filename}</span>
                <button
                  onClick={() => removeAttachment(i)}
                  className="ml-0.5 text-gray-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {uploading && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent-cyan" />
                Uploading...
              </span>
            )}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* File attachment buttons */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={openCamera}
              disabled={isStreaming}
              title="Take a photo"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30"
            >
              <Camera size={15} />
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={isStreaming}
              title="Upload images"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30"
            >
              <ImageIcon size={15} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              title="Upload files"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30"
            >
              <Paperclip size={15} />
            </button>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && processFiles(e.target.files)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.csv,.json,.xml,.pdf,.doc,.docx,.log"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && processFiles(e.target.files)}
          />

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? "Listening..."
                : isStreaming
                  ? "Waiting for response..."
                  : "Type a message..."
            }
            rows={1}
            disabled={isStreaming}
            className="max-h-[200px] min-h-[24px] flex-1 resize-none bg-transparent text-sm text-white outline-none placeholder:text-gray-500 disabled:opacity-40 focus:ring-0"
          />

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleMicToggle}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                isListening
                  ? "bg-red-500/20 text-red-400"
                  : error
                    ? "bg-red-500/10 text-red-400/50"
                    : "text-gray-500 hover:bg-white/5 hover:text-white"
              }`}
            >
              {isListening ? (
                <span className="relative flex h-4 w-4 items-center justify-center">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-red-400/40" />
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                </span>
              ) : (
                <Mic size={15} />
              )}
            </button>

            {isStreaming ? (
              <button
                onClick={onCancel}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-red-400"
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!value.trim() && attachments.length === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-cyan to-cyan-400 text-black transition-all hover:shadow-[0_0_12px_rgba(0,229,255,0.4)] disabled:opacity-30 disabled:hover:shadow-none"
              >
                <Send size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
