import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      name: {
        type: String,
        required: true
      },
      role: {
        type: String,
        required: true,
        enum: ["admin", "customer", "driver"]
      }
    },
    content: {
      type: String,
      required: true
    },
    attachment: {
      type: String,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    // Optional reference to an order if this message is within an order thread
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true
    }
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);