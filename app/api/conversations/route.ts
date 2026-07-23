import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getConversationsByUser,
  createConversation,
  getConversationById,
  deleteConversation,
  deleteAllUserConversations,
} from "@/lib/db/conversations";
import { connectToDatabase } from "@/lib/mongodb";
import Message from "@/models/Message";
import type { IConversation } from "@/models/Conversation";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const conversations = await getConversationsByUser(userId);
    return Response.json(conversations);
  } catch (err) {
    console.error("GET /api/conversations error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title } = await req.json();
    await connectToDatabase();
    const conversation = await createConversation(userId, title || "New Chat");
    return Response.json(conversation, { status: 201 });
  } catch (err) {
    console.error("POST /api/conversations error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversationId = req.nextUrl.searchParams.get("conversationId");

  try {
    await connectToDatabase();

    if (conversationId) {
      const conversation = await getConversationById(conversationId);
      if (!conversation) {
        return Response.json({ error: "Conversation not found" }, { status: 404 });
      }
      if ((conversation as IConversation).userId !== userId) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      await Message.deleteMany({ conversationId });
      await deleteConversation(conversationId);
      return Response.json({ success: true });
    }

    const userConvs = await getConversationsByUser(userId);
    const ids = userConvs.map((c) => (c as IConversation)._id);
    if (ids.length > 0) {
      await Message.deleteMany({ conversationId: { $in: ids } });
    }
    await deleteAllUserConversations(userId);
    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/conversations error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
