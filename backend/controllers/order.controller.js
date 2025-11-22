import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js"; // ✅ ADD THIS IMPORT

// Get all orders
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error in getAllOrders:", error);
        res.status(500).json({ message: "Server error while fetching orders" });
    }
};

// Get orders by status
export const getOrdersByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const orders = await Order.find({ status }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error in getOrdersByStatus:", error);
        res.status(500).json({ message: "Server error while fetching orders by status" });
    }
};

// Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        res.status(200).json(order);
    } catch (error) {
        console.error("Error in getOrderById:", error);
        res.status(500).json({ message: "Server error while fetching order" });
    }
};

// Create new order
export const createOrder = async (req, res) => {
  try {
    const { 
      customer, 
      items, 
      total, 
      deliveryFee = 0,      // ✅ Get deliveryFee from request
      deliveryDistance = 0,  // ✅ Get deliveryDistance from request
      notes, 
      paymentMethod, 
      paymentStatus, 
      gcashReferenceNumber, 
      gcashProofImage, 
      deliveryAddress 
    } = req.body;

    console.log("📦 Creating order with data:", {
      customer,
      items,
      total,
      deliveryFee,
      deliveryDistance,
      calculatedTotal: total // Should already include delivery fee from frontend
    });

    // ✅ CRITICAL: Verify the total includes delivery fee
    const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const expectedTotal = itemsTotal + deliveryFee;
    
    console.log("💰 Total verification:", {
      itemsTotal,
      deliveryFee,
      expectedTotal,
      receivedTotal: total,
      difference: Math.abs(expectedTotal - total)
    });

    // ✅ If the received total doesn't match expected, use the expected total
    const finalTotal = Math.abs(expectedTotal - total) < 0.01 ? total : expectedTotal;

    const newOrder = new Order({
      customer,
      items,
      total: finalTotal,              // ✅ Use verified total
      deliveryFee: deliveryFee,       // ✅ Store delivery fee
      deliveryDistance: deliveryDistance, // ✅ Store distance
      notes,
      paymentMethod,
      paymentStatus,
      gcashReferenceNumber,
      gcashProofImage,
      deliveryAddress,
      status: "Pending"
    });

    const savedOrder = await newOrder.save();
    
    console.log("✅ Order saved successfully:", {
      orderId: savedOrder._id,
      total: savedOrder.total,
      deliveryFee: savedOrder.deliveryFee,
      deliveryDistance: savedOrder.deliveryDistance
    });

    // Emit socket event for real-time updates
    const io = req.app.get("io");
    if (io) {
      io.emit("new-order", {
        orderId: savedOrder._id,
        customerName: savedOrder.customer.name,
        total: savedOrder.total,
        items: savedOrder.items.length
      });
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("❌ Error creating order:", error);
    res.status(500).json({ 
      message: "Server error while creating order",
      error: error.message 
    });
  }
};

// Update order
export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const updatedOrder = await Order.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        );
        
        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error("Error in updateOrder:", error);
        res.status(500).json({ message: "Server error while updating order" });
    }
};

// Get all possible order statuses
export const getOrderStatuses = async (req, res) => {
  try {
    const statuses = ["Pending", "Processing", "Delivered", "Completed", "Cancelled"];
    res.status(200).json(statuses);
  } catch (error) {
    console.error("Error getting order statuses:", error);
    res.status(500).json({ message: "Server error while getting order statuses" });
  }
};

// Update order status with real-time socket broadcast
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ["Pending", "Processing", "Delivered", "Completed", "Cancelled"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('customer', 'name email');

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Broadcast the order update to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('order-status-updated', {
        orderId: updatedOrder._id,
        status: updatedOrder.status,
        customerId: updatedOrder.customer._id,
        customerName: updatedOrder.customer.name,
        updatedAt: updatedOrder.updatedAt
      });
      console.log(`📡 Broadcasting order status update: ${updatedOrder._id} -> ${status}`);
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server error while updating order status" });
  }
};

// Delete order
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedOrder = await Order.findByIdAndDelete(id);
        
        if (!deletedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        console.error("Error in deleteOrder:", error);
        res.status(500).json({ message: "Server error while deleting order" });
    }
};

// Get orders for the current customer
export const getCustomerOrders = async (req, res) => {
    try {
        // Try to get email from token first
        let customerEmail = req.user?.email;
        
        // If not available in token, try query parameter
        if (!customerEmail && req.query.email) {
            customerEmail = req.query.email;
        }
        
        if (!customerEmail) {
            return res.status(400).json({ message: "Customer email not found" });
        }
        
        // Find orders by customer email
        const orders = await Order.find({ "customer.email": customerEmail })
            .sort({ createdAt: -1 })
            .populate("items.product");
        
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error in getCustomerOrders:", error);
        res.status(500).json({ message: "Server error while fetching customer orders" });
    }
};