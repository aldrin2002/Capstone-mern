import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // Customer who owns this conversation
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    // Optional linked order (dedicated thread for an order inquiry)
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true
    },
    // Timestamp of last message
    lastMessage: {
      type: Date,
      default: Date.now
    },
    // Cached preview content
    lastMessageContent: {
      type: String,
      default: ""
    },
    // Who sent last message
    lastMessageSender: {
      type: String,
      enum: ["admin", "customer", "driver"],
      default: null
    },
    // Unread count for admin dashboard notifications
    unreadCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export const Conversation = mongoose.model("Conversation", conversationSchema);