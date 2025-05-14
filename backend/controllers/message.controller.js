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

// Delete a single message
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the message to get attachment info before deletion
    const message = await Message.findById(id);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Delete the message
    await Message.findByIdAndDelete(id);
    
    // If message had an attachment, could add file removal here
    // if (message.attachment) {
    //   const filePath = path.join(process.cwd(), 'uploads', path.basename(message.attachment));
    //   if (fs.existsSync(filePath)) {
    //     fs.unlinkSync(filePath);
    //   }
    // }
    
    res.status(200).json({ message: "Message deleted successfully" });
    
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    res.status(500).json({ message: "Server error while deleting message" });
  }
};

// Delete an entire conversation and its messages
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find all messages in the conversation first to handle attachments
    const messages = await Message.find({ conversation: id });
    
    // Delete all messages in the conversation
    await Message.deleteMany({ conversation: id });
    
    // Delete the conversation
    const deletedConversation = await Conversation.findByIdAndDelete(id);
    
    if (!deletedConversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    
    // Could add cleanup of attachment files here if needed
    
    res.status(200).json({ message: "Conversation and messages deleted successfully" });
    
  } catch (error) {
    console.error("Error in deleteConversation:", error);
    res.status(500).json({ message: "Server error while deleting conversation" });
  }
};