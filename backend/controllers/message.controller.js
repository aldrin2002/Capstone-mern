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
    console.log("Upload attachment request received", req.file);
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    // Use forward slashes for path consistency
    const filePath = `/uploads/${req.file.filename}`;
    console.log("File saved with path:", filePath);
    
    res.status(200).json({ filePath });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    res.status(500).json({ message: "Server error uploading file", error: error.message });
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

// Get unread count for all conversations
export const getUnreadCount = async (req, res) => {
  try {
    console.log("Getting unread count for user:", req.userId, "role:", req.role);
    
    // Find all conversations and sum up unread counts
    const conversations = await Conversation.find();
    
    // For admin notifications, we only care about customer messages (unreadCount field)
    const totalUnreadCount = conversations.reduce((sum, conv) => {
      return sum + (conv.unreadCount || 0);
    }, 0);
    
    console.log("Total unread messages:", totalUnreadCount);
    res.status(200).json({ count: totalUnreadCount });
  } catch (error) {
    console.error("Error in getUnreadCount:", error);
    res.status(500).json({ message: "Server error while getting unread count" });
  }
};

// Add this function to mark all messages as read
export const markAllMessagesAsRead = async (req, res) => {
  try {
    console.log("Marking all messages as read for admin");
    
    // Reset unread count for all conversations
    await Conversation.updateMany(
      { unreadCount: { $gt: 0 } },
      { $set: { unreadCount: 0 } }
    );
    
    console.log("All messages marked as read");
    res.status(200).json({ message: "All messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Server error while marking messages as read" });
  }
};