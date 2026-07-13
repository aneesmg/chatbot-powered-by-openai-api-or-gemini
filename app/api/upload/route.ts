import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TEXT_EXTENSIONS = new Set([
  ".txt", ".md", ".csv", ".json", ".xml", ".yml", ".yaml",
  ".log", ".env", ".ini", ".cfg", ".toml",
]);

const IMAGE_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp",
]);

interface UploadResult {
  filename: string;
  type: "image" | "text" | "other";
  content: string;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    // Text files — read directly
    if (TEXT_EXTENSIONS.has(ext)) {
      const text = buffer.toString("utf-8");
      return Response.json({
        filename: file.name,
        type: "text",
        content: text,
      } satisfies UploadResult);
    }

    // Images — describe via Groq vision
    if (IMAGE_EXTENSIONS.has(ext)) {
      const base64 = buffer.toString("base64");
      const mime = file.type || "image/jpeg";
      const dataUri = `data:${mime};base64,${base64}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const completion = await (groq.chat.completions.create as any)({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Describe this image in detail — what objects, people, text, or settings do you see? Be specific and thorough." },
              { type: "image_url", image_url: { url: dataUri } },
            ],
          },
        ],
      });

      const description = completion.choices[0]?.message?.content || "";

      return Response.json({
        filename: file.name,
        type: "image",
        content: description,
      } satisfies UploadResult);
    }

    // Other file types — note the filename only
    return Response.json({
      filename: file.name,
      type: "other",
      content: `[File attached: ${file.name} (${(buffer.length / 1024).toFixed(1)} KB)]`,
    } satisfies UploadResult);
  } catch (err) {
    console.error("Upload error:", err);
    return Response.json({ error: "Upload processing failed" }, { status: 500 });
  }
}
