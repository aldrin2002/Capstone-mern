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
    let conversation = await Conversation.findOne({
      customer: customerId,
      order: null,
      $or: [{ threadType: "admin" }, { threadType: { $exists: false } }]
    });
    if (!conversation) {
      conversation = await Conversation.create({ customer: customerId, threadType: "admin" });
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
    // Store owner thread for this order
    let conversation = await Conversation.findOne({
      customer: customerId,
      order: orderId,
      $or: [{ threadType: "admin" }, { threadType: { $exists: false } }]
    });
    if (!conversation) {
      conversation = await Conversation.create({
        customer: customerId,
        order: orderId,
        threadType: "admin",
        lastMessageContent: "Order inquiry thread created",
        lastMessageSender: "customer"
      });
      // Add system message marking thread creation
      await Message.create({
        sender: { id: customerId, name: order.customer?.name || "Customer", role: "customer" },
        content: `Inquiry thread opened for order #${orderId.toString().slice(-6)}`,
        conversation: conversation._id,
        order: orderId,
        isRead: true
      });
    }

    await conversation.populate([
      { path: 'order', populate: { path: 'driverAssigned', select: 'name email role' } },
      { path: 'driver', select: 'name email role' }
    ]);
    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error in getOrCreateOrderConversation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create or get customer-driver conversation for a specific order
export const getOrCreateDriverConversation = async (req, res) => {
  try {
    const customerId = req.userId;
    const { orderId } = req.params;

    const [order, customerUser] = await Promise.all([
      Order.findById(orderId),
      User.findById(customerId).select("email name")
    ]);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!customerUser || order.customer?.email !== customerUser.email) {
      return res.status(403).json({ message: "You can only message drivers for your own orders" });
    }

    if (!order.driverAssigned) {
      return res.status(400).json({ message: "No driver assigned yet" });
    }

    let conversation = await Conversation.findOne({
      customer: customerId,
      order: orderId,
      threadType: "driver",
      driver: order.driverAssigned
    });

    if (!conversation) {
      conversation = await Conversation.create({
        customer: customerId,
        order: orderId,
        threadType: "driver",
        driver: order.driverAssigned,
        lastMessageContent: "Driver chat opened",
        lastMessageSender: "customer"
      });

      await Message.create({
        sender: { id: customerId, name: customerUser.name, role: "customer" },
        content: `Driver chat opened for order #${orderId.toString().slice(-6)}`,
        conversation: conversation._id,
        order: orderId,
        isRead: true
      });
    }

    await conversation.populate([
      { path: 'order', populate: { path: 'driverAssigned', select: 'name email role' } },
      { path: 'driver', select: 'name email role' }
    ]);
    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error in getOrCreateDriverConversation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create or get a conversation for staff tied to a specific order
export const getOrCreateOrderConversationForStaff = async (req, res) => {
  try {
    const { orderId, customerId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const threadType = req.role === "driver" ? "driver" : "admin";
    const findFilter = {
      order: orderId,
      threadType,
      ...(threadType === "driver" ? { driver: req.userId } : {}),
      ...(customerId ? { customer: customerId } : {})
    };

    let conversation = await Conversation.findOne(findFilter);

    // If none exists, create one
    if (!conversation) {
      if (!customerId) {
        return res.status(400).json({ message: "customerId is required" });
      }

      conversation = await Conversation.create({
        customer: customerId,
        order: orderId,
        threadType,
        driver: threadType === "driver" ? req.userId : null,
        lastMessageContent: "Order inquiry thread created by staff",
        lastMessageSender: req.role === "driver" ? "driver" : "admin",
      });

      // Seed a system message to mark thread creation
      await Message.create({
        sender: { id: req.userId, name: req.role === "driver" ? "Driver" : "Admin", role: req.role === "driver" ? "driver" : "admin" },
        content: `Staff opened inquiry thread for order #${orderId.toString().slice(-6)}`,
        conversation: conversation._id,
        order: orderId,
        isRead: true,
      });
    }

    await conversation.populate([
      { path: 'order', populate: { path: 'driverAssigned', select: 'name email role' } },
      { path: 'driver', select: 'name email role' }
    ]);
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
    // Find order-linked conversations (store owner + driver) with active orders
    const conversations = await Conversation.find({ customer: customerId, order: { $ne: null } })
      .populate({
        path: 'order',
        match: { status: { $nin: ["Completed", "Cancelled"] } },
        populate: { path: 'driverAssigned', select: 'name email role' }
      })
      .populate('driver', 'name email role')
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
    const threadType = req.query.threadType === "driver" ? "driver" : "admin";

    const conversation = await Conversation.findOne({
      customer: customerId,
      order: orderId,
      $or: threadType === "admin"
        ? [{ threadType: "admin" }, { threadType: { $exists: false } }]
        : [{ threadType: "driver" }]
    })
      .populate({ path: 'order', populate: { path: 'driverAssigned', select: 'name email role' } })
      .populate('driver', 'name email role');

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
    const role = req.role;

    let filter = {};
    if (role === "driver") {
      filter = { threadType: "driver", driver: req.userId };
    } else if (role === "admin") {
      filter = { $or: [{ threadType: "admin" }, { threadType: { $exists: false } }] };
    }

    const conversations = await Conversation.find(filter)
      .populate('customer', 'name email')
      .populate('driver', 'name email role')
      .populate('order', 'status driverAssigned')
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