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
        const { customer, items, notes, paymentMethod } = req.body;
        
        // Validate required fields
        if (!customer || !customer.name || !customer.email || !items || items.length === 0) {
            return res.status(400).json({ message: "Customer details and at least one item are required" });
        }
        
        // Calculate total and validate items
        let total = 0;
        const orderItems = [];
        
        for (const item of items) {
            if (!item.product || !item.quantity) {
                return res.status(400).json({ message: "Each item must have a product ID and quantity" });
            }
            
            // Get product details to ensure it exists and get the current price
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(400).json({ message: `Product with ID ${item.product} not found` });
            }
            
            // Calculate item subtotal
            const itemTotal = product.price * item.quantity;
            total += itemTotal;
            
            // Add to order items
            orderItems.push({
                product: item.product,
                name: product.name,
                quantity: item.quantity,
                price: product.price
            });
        }
        
        const newOrder = new Order({
            customer,
            items: orderItems,
            total,
            notes: notes || "",
            paymentMethod: paymentMethod || "Cash"
        });
        
        const savedOrder = await newOrder.save();
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

// Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }
        
        const updatedOrder = await Order.findByIdAndUpdate(
            id, 
            { status }, 
            { new: true, runValidators: true }
        );
        
        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error("Error in updateOrderStatus:", error);
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