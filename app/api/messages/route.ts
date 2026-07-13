import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMessagesByConversation, deleteMessagesByConversation } from "@/lib/db/messages";
import { getConversationById } from "@/lib/db/conversations";
import { connectToDatabase } from "@/lib/mongodb";
import type { IConversation } from "@/models/Conversation";

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversationId = req.nextUrl.searchParams.get("conversationId");

  if (!conversationId) {
    return Response.json({ error: "conversationId query param is required" }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const conversation = await getConversationById(conversationId);

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    if ((conversation as IConversation).userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await getMessagesByConversation(conversationId);
    return Response.json(messages);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversationId = req.nextUrl.searchParams.get("conversationId");

  if (!conversationId) {
    return Response.json({ error: "conversationId query param is required" }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const conversation = await getConversationById(conversationId);

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    if ((conversation as IConversation).userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteMessagesByConversation(conversationId);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
