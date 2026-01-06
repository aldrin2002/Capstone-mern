import { Message } from "../models/message.model.js";
import { Conversation } from "../models/conversation.model.js";
import { Order } from "../models/order.model.js";
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
    // General (non-order) conversation
    let conversation = await Conversation.findOne({ customer: customerId, order: null });
    if (!conversation) {
      conversation = await Conversation.create({ customer: customerId });
    }
    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error in getOrCreateConversation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create or get a conversation tied to a specific order
export const getOrCreateOrderConversation = async (req, res) => {
  try {
    const customerId = req.userId;
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    // Try to find conversation already tied to this order
    let conversation = await Conversation.findOne({ customer: customerId, order: orderId });
    if (!conversation) {
      // Reuse general conversation if available
      let general = await Conversation.findOne({ customer: customerId, order: null });
      if (general) {
        general.order = orderId;
        general.lastMessageContent = "Order inquiry thread created";
        general.lastMessageSender = "customer";
        await general.save();
        conversation = general;
      } else {
        // As a fallback create a new conversation (first for this user)
        conversation = await Conversation.create({
          customer: customerId,
          order: orderId,
          lastMessageContent: "Order inquiry thread created",
          lastMessageSender: "customer"
        });
      }
      // Add system message marking thread creation
      await Message.create({
        sender: { id: customerId, name: order.customer.name, role: "customer" },
        content: `Inquiry thread opened for order #${orderId.toString().slice(-6)}`,
        conversation: conversation._id,
        order: orderId,
        isRead: true
      });
    }

    await conversation.populate('order');
    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error in getOrCreateOrderConversation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create or get a conversation for staff tied to a specific order
export const getOrCreateOrderConversationForStaff = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find existing conversation for this order (regardless of requester)
    let conversation = await Conversation.findOne({ order: orderId });

    // If none exists, create one using the order's customer
    if (!conversation) {
      conversation = await Conversation.create({
        customer: order.customer?.id || undefined, // fallback if schema differs
        order: orderId,
        lastMessageContent: "Order inquiry thread created by staff",
        lastMessageSender: "admin",
      });

      // Seed a system message to mark thread creation
      await Message.create({
        sender: { id: req.userId, name: "Admin", role: "admin" },
        content: `Staff opened inquiry thread for order #${orderId.toString().slice(-6)}`,
        conversation: conversation._id,
        order: orderId,
        isRead: true,
      });
    }

    await conversation.populate("order");
    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error in getOrCreateOrderConversationForStaff:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get active order-linked conversations for current customer
export const getActiveOrderConversations = async (req, res) => {
  try {
    const customerId = req.userId;
    // Find conversations with orders not Completed/Cancelled
    const conversations = await Conversation.find({ customer: customerId, order: { $ne: null } })
      .populate({ path: 'order', match: { status: { $nin: ["Completed", "Cancelled"] } } })
      .sort({ updatedAt: -1 });

    // Filter out those where order populate failed (status completed/cancelled)
    const active = conversations.filter(c => c.order);
    res.status(200).json(active);
  } catch (error) {
    console.error("Error in getActiveOrderConversations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Detailed conversation: order + messages
export const getOrderConversationDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.userId;
    const conversation = await Conversation.findOne({ customer: customerId, order: orderId }).populate('order');
    if (!conversation) return res.status(404).json({ message: "Order conversation not found" });
    const messages = await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 });
    res.status(200).json({ conversation, messages });
  } catch (error) {
    console.error("Error in getOrderConversationDetails:", error);
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