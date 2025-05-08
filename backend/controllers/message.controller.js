import { Message } from "../models/message.model.js";
import { Conversation } from "../models/conversation.model.js";
import { User } from "../models/user.model.js";

// Get messages for a specific conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 });
    
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({ message: "Server error while fetching messages" });
  }
};

// Get or create customer conversation
export const getOrCreateConversation = async (req, res) => {
  try {
    const customerId = req.userId;
    
    // Find existing conversation or create new one
    let conversation = await Conversation.findOne({ customer: customerId });
    
    if (!conversation) {
      conversation = new Conversation({
        customer: customerId
      });
      await conversation.save();
    }
    
    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error in getOrCreateConversation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all conversations (for admin)
export const getAllConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .populate('customer', 'name email')
      .sort({ lastMessage: -1 });
    
    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error in getAllConversations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Upload attachment
export const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const filePath = `/uploads/${req.file.filename}`;
    res.status(200).json({ filePath });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    res.status(500).json({ message: "Server error" });
  }
};