import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";

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
        const { customer, items, notes, paymentMethod, proofOfPayment, total } = req.body;
        
        // Validate required fields
        if (!customer || !customer.name || !customer.email || !items || items.length === 0) {
            return res.status(400).json({ message: "Customer details and at least one item are required" });
        }
        
        // Calculate total and validate items
        let calculatedTotal = 0;
        const orderItems = [];
        const stockUpdates = []; // Track stock updates for products
        
        for (const item of items) {
            if (!item.product || !item.quantity) {
                return res.status(400).json({ message: "Each item must have a product ID and quantity" });
            }
            
            // Get product details to ensure it exists and get the current price
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(400).json({ message: `Product with ID ${item.product} not found` });
            }
            
            // Check if enough stock is available
            if (product.stock < item.quantity) {
                return res.status(400).json({ 
                    message: `Not enough stock for ${product.name}. Only ${product.stock} available.` 
                });
            }
            
            // Calculate item subtotal
            const itemTotal = product.price * item.quantity;
            calculatedTotal += itemTotal;
            
            // Add to order items
            orderItems.push({
                product: item.product,
                name: product.name,
                quantity: item.quantity,
                price: product.price
            });
            
            // Track stock update
            stockUpdates.push({
                productId: product._id,
                newStock: product.stock - item.quantity
            });
        }
        
        // Use provided total if available, otherwise use calculated total
        const finalTotal = total !== undefined ? total : calculatedTotal;
        
        // Set payment status based on payment method
        const paymentStatus = paymentMethod === "Online Payment" && proofOfPayment ? "Paid" : "Pending";
        
        // Create and save the order first
        const newOrder = new Order({
            customer,
            items: orderItems,
            total: finalTotal,
            notes: notes || "",
            paymentMethod: paymentMethod || "Cash",
            paymentStatus,
            proofOfPayment: proofOfPayment || ""
        });
        
        const savedOrder = await newOrder.save();
        
        // After successful order creation, update all product stocks
        for (const update of stockUpdates) {
            await Product.findByIdAndUpdate(
                update.productId, 
                { stock: update.newStock },
                { new: true }
            );
        }
        
        // Emit socket event for real-time notification
        const io = req.app.get('io');
        if (io) {
            console.log('📱 Emitting new-order event');
            io.to('admin-room').emit('new-order', {
                orderId: savedOrder._id,
                customerName: savedOrder.customer.name,
                total: savedOrder.total,
                createdAt: savedOrder.createdAt
            });
        }
        
        res.status(201).json(savedOrder);
    } catch (error) {
        console.error("Error in createOrder:", error);
        res.status(500).json({ message: "Server error while creating order" });
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