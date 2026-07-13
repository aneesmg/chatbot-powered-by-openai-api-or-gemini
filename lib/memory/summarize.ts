import { connectToDatabase } from "@/lib/mongodb";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const THRESHOLD = 20;
const KEEP_LATEST = 10;

export async function maybeSummarize(conversationId: string): Promise<void> {
  try {
    await connectToDatabase();

    const totalCount = await Message.countDocuments({ conversationId });

    if (totalCount <= THRESHOLD) return;

    const allMessages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    const toSummarize = allMessages.slice(0, -KEEP_LATEST);

    const formatted = toSummarize
      .map(
        (m) =>
          `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
      )
      .join("\n\n");

    const prompt = `Summarize the following conversation concisely. Capture key facts, decisions, preferences, and context that would be useful for continuing naturally. Ignore pleasantries. Keep it to 3-5 sentences.\n\n${formatted}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
    });

    const summary = completion.choices[0]?.message?.content?.trim() || "";

    if (summary) {
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { contextSummary: summary } }
      );
    }
  } catch (err) {
    console.error("Summarization error:", err);
  }
}
