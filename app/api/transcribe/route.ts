import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Whisper transcription unavailable — no API key configured" },
      { status: 501 }
    );
  }

  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    if (!audio) {
      return Response.json({ error: "No audio file provided" }, { status: 400 });
    }

    const whisperForm = new FormData();
    whisperForm.append("file", audio, "recording.webm");
    whisperForm.append("model", "whisper-1");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    });

    if (!res.ok) {
      return Response.json({ error: "Whisper API error" }, { status: 502 });
    }

    const data = await res.json();
    return Response.json({ text: data.text });
  } catch {
    return Response.json({ error: "Transcription failed" }, { status: 500 });
  }
}
