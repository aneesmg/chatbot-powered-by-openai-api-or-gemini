import { connectToDatabase } from "@/lib/mongodb";
import Message, { IMessage } from "@/models/Message";

export async function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<IMessage> {
  await connectToDatabase();
  const message = await Message.create({ conversationId, role, content });
  return message;
}

export async function getMessagesByConversation(conversationId: string): Promise<IMessage[]> {
  await connectToDatabase();
  const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
  return messages as unknown as IMessage[];
}

export async function getRecentMessagesForContext(
  conversationId: string,
  limit: number
): Promise<IMessage[]> {
  await connectToDatabase();
  const messages = await Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .limit(limit);
  return messages.reverse() as unknown as IMessage[];
}

export async function deleteMessagesByConversation(conversationId: string): Promise<void> {
  await connectToDatabase();
  await Message.deleteMany({ conversationId });
}
