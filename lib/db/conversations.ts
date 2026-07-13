import { connectToDatabase } from "@/lib/mongodb";
import Conversation, { IConversation } from "@/models/Conversation";

export async function createConversation(userId: string, title: string): Promise<IConversation> {
  await connectToDatabase();
  const conversation = await Conversation.create({ userId, title });
  return conversation;
}

export async function getConversationsByUser(userId: string): Promise<IConversation[]> {
  await connectToDatabase();
  const conversations = await Conversation.find({ userId }).sort({ updatedAt: -1 });
  return conversations as unknown as IConversation[];
}

export async function getConversationById(id: string): Promise<IConversation | null> {
  await connectToDatabase();
  const conversation = await Conversation.findById(id);
  return conversation as unknown as IConversation | null;
}

export async function deleteConversation(id: string): Promise<void> {
  await connectToDatabase();
  await Conversation.findByIdAndDelete(id);
}

export async function deleteAllUserConversations(userId: string): Promise<void> {
  await connectToDatabase();
  await Conversation.deleteMany({ userId });
}
