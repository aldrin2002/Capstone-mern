import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    lastMessage: {
      type: Date,
      default: Date.now
    },
    unreadCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export const Conversation = mongoose.model("Conversation", conversationSchema);