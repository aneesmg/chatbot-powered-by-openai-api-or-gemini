import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConversation extends Document {
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  contextSummary?: string;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    contextSummary: { type: String },
  },
  { timestamps: true }
);

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ?? mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
