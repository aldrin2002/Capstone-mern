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
        enum: ["admin", "customer"]
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
      required: true
    }
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);