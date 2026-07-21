"use client";

import { useState, useRef, useCallback } from "react";

interface UseVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  isFallback: boolean;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const hasSpeechRecognition =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in (window as any));

  const isSupported = hasSpeechRecognition;
  const isFallback = !hasSpeechRecognition;

  const startListening = useCallback(() => {
    setTranscript("");
    setError(null);
    chunksRef.current = [];

    if (hasSpeechRecognition) {
      const SR =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let text = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setTranscript(text);
      };

      recognition.onerror = (event: any) => {
        setError(
          event.error === "not-allowed"
            ? "Microphone permission denied"
            : `Recognition error: ${event.error}`
        );
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
      } catch {
        setError("Failed to start speech recognition");
      }
    } else {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const recorder = new MediaRecorder(stream);
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };
          recorder.start();
          recorderRef.current = recorder;
          setIsListening(true);
        })
        .catch((err: DOMException) => {
          setError(
            err.name === "NotAllowedError"
              ? "Microphone permission denied"
              : "Microphone access failed"
          );
        });
    }
  }, [hasSpeechRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (
      recorderRef.current &&
      recorderRef.current.state !== "inactive"
    ) {
      recorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        try {
          const { transcribeAudio } = await import("@/lib/voice/whisper");
          const text = await transcribeAudio(blob);
          setTranscript(text);
        } catch {
        }
        recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
        recorderRef.current = null;
      };
      recorderRef.current.stop();
    }

    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    isSupported,
    isFallback,
  };
}
