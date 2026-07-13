"use client";

import { MicOff } from "lucide-react";

export default function PermissionModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass mx-4 w-full max-w-sm animate-fade-in rounded-2xl p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
          <MicOff size={24} className="text-red-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">
          Microphone Access Denied
        </h3>
        <p className="mb-6 text-sm leading-relaxed text-gray-400">
          Enable microphone access in your browser settings, then reload the
          page to use voice input.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="glass rounded-xl px-5 py-2 text-sm text-white transition-all hover:bg-white/10"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
