import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import { addMessage } from "@/lib/db/messages";
import { getConversationById } from "@/lib/db/conversations";
import type { IConversation } from "@/models/Conversation";
import { connectToDatabase } from "@/lib/mongodb";
import { maybeSummarize } from "@/lib/memory/summarize";
import Message from "@/models/Message";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface FileAttachment {
  filename: string;
  type: "image" | "text" | "other";
  content: string;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    conversationId?: string;
    message?: string;
    files?: FileAttachment[];
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { conversationId, message, files } = body;

  if (!conversationId || !message) {
    return Response.json(
      { error: "conversationId and message are required" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    // Fetch conversation and build history in parallel
    const [conversation, recentMessages] = await Promise.all([
      getConversationById(conversationId),
      Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    if ((conversation as IConversation).userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let userContent = message;

    if (files && files.length > 0) {
      const fileBlocks = files
        .map(
          (f) =>
            `--- ${f.filename} ---\n${
              f.type === "image"
                ? `[Image description: ${f.content}]`
                : f.content
            }`
        )
        .join("\n\n");

      userContent = `${message}\n\nAttached files:\n${fileBlocks}`;
    }

    const history: { role: "user" | "assistant"; content: string }[] = [];

    if (conversation.contextSummary) {
      history.push({
        role: "assistant",
        content: `Summary of earlier conversation: ${conversation.contextSummary}`,
      });
    }

    for (const msg of recentMessages.reverse()) {
      history.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }

    await addMessage(conversationId, "user", userContent);

    const messagesForGroq = [...history, { role: "user" as const, content: userContent }];

    const responseStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullResponse = "";

        try {
          const stream = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: messagesForGroq,
            stream: true,
          });

          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              fullResponse += text;
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err: unknown) {
          const apiError = err as { status?: number; message?: string };
          if (apiError?.status === 429) {
            controller.enqueue(
              encoder.encode(
                `Error: API rate limit reached. Please wait about ${apiError?.message?.match(/\d+/)?.[0] || 30} seconds before sending another message.`
              )
            );
          } else {
            console.error("Groq streaming error:", err);
            controller.enqueue(
              encoder.encode("Error: Failed to generate response. Please try again.")
            );
          }
          controller.close();

          try {
            await addMessage(conversationId, "assistant", fullResponse || "Error: Failed to generate response.");
          } catch {
            // ignore save error
          }
          return;
        }

        controller.close();

        try {
          await addMessage(conversationId, "assistant", fullResponse);

          maybeSummarize(conversationId).catch((err) =>
            console.error("Summarization trigger failed:", err)
          );
        } catch {
          console.error("Failed to save assistant message");
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
