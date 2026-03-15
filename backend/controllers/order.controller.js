import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";

// Get all orders
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('items.product', 'name price image category stock')
            .populate('driverAssigned', 'name email role')
            .sort({ createdAt: -1 });
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
        const orders = await Order.find({ status })
            .populate('items.product', 'name price image category stock')
            .populate('driverAssigned', 'name email role')
            .sort({ createdAt: -1 });
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
        const order = await Order.findById(id)
            .populate('items.product', 'name price image category stock')
            .populate('driverAssigned', 'name email role');
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        res.status(200).json(order);
    } catch (error) {
        console.error("Error in getOrderById:", error);
        res.status(500).json({ message: "Server error while fetching order" });
    }
};

// ✅ FIXED: Create order with proper inventory management
export const createOrder = async (req, res) => {
    try {
        const { 
            customer, 
            items, 
            total, 
            paymentMethod, 
            deliveryAddress, 
            notes, 
            gcashReferenceNumber,  // ✅ FIXED: Changed from gcashReference
            gcashProofImage,       // ✅ FIXED: Changed from proofOfPayment
            deliveryFee,
            deliveryDistance 
        } = req.body;

        console.log("📦 Creating new order with data:", {
            customer,
            itemsCount: items?.length,
            total,
            paymentMethod,
            gcashReferenceNumber,
            gcashProofImage,
            deliveryFee,
            deliveryDistance
        });

        // ✅ Validation
        if (!customer || !customer.email || !customer.name) {
            return res.status(400).json({ 
                success: false,
                message: "Customer information is required" 
            });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: "Order must contain at least one item" 
            });
        }

        if (!deliveryAddress || deliveryAddress.trim() === "") {
            return res.status(400).json({ 
                success: false,
                message: "Delivery address is required" 
            });
        }

        // ✅ STEP 1: Validate and check stock availability for all items FIRST
        const productUpdates = [];
        
        for (const item of items) {
            const product = await Product.findById(item.product);
            
            if (!product) {
                return res.status(404).json({ 
                    success: false,
                    message: `Product not found: ${item.name}` 
                });
            }

            // ✅ Check if product has enough stock (using 'stock' field, not 'quantity')
            if (product.stock < item.quantity) {
                return res.status(400).json({ 
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
                });
            }

            // Store product and quantity for later update
            productUpdates.push({
                product,
                orderedQuantity: item.quantity
            });

            console.log(`✅ Stock check passed for ${product.name}: Available: ${product.stock}, Ordering: ${item.quantity}`);
        }

        // ✅ STEP 2: All items are available, now decrement stock and save
        for (const update of productUpdates) {
            const { product, orderedQuantity } = update;
            
            // Decrement stock
            product.stock -= orderedQuantity;
            
            // Save the updated product
            await product.save();
            
            console.log(`📉 Decremented stock for ${product.name}: New stock: ${product.stock} (was ${product.stock + orderedQuantity})`);
        }

        // ✅ STEP 3: Create the order
        const newOrder = new Order({
            customer: {
                name: customer.name,
                email: customer.email,
                phone: customer.phone || "",
                location: customer.location || null
            },
            items,
            total,
            paymentMethod: paymentMethod || "GCash",
            deliveryAddress: deliveryAddress.trim(),
            notes: notes || "",
            gcashReferenceNumber: gcashReferenceNumber || "",  // ✅ FIXED
            gcashProofImage: gcashProofImage || "",            // ✅ FIXED
            deliveryFee: deliveryFee || 0,
            deliveryDistance: deliveryDistance || 0,
            status: "Pending"
        });

        const savedOrder = await newOrder.save();
        
        console.log(`✅ Order created successfully: ${savedOrder._id}`);
        console.log(`📊 Inventory decremented for ${productUpdates.length} products`);

        // Emit socket event for real-time notifications
        if (req.io) {
            req.io.emit('new-order', savedOrder);
            console.log("🔔 New order notification sent via socket");
        }

        res.status(201).json({ 
            success: true,
            message: "Order created successfully",
            order: savedOrder 
        });
        
    } catch (error) {
        console.error("❌ Error in createOrder:", error);
        res.status(500).json({ 
            success: false,
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
    ).populate('driverAssigned', 'name email role');
        
        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }
    // Broadcast full order update so client can refresh header details
    const io = req.app.get('io');
    if (io) {
      io.emit('order-updated', { order: updatedOrder });
      console.log(`📡 Broadcasting order update (non-status): ${updatedOrder._id}`);
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

    const validStatuses = ["Pending", "Preparing Food", "Ready for Delivery", "Processing", "Delivered", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status" 
      });
    }

    const order = await Order.findById(id).populate("customer", "email name");
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    const previousStatus = order.status;

        if (status === "Completed" && req.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admin can approve final completion"
            });
        }

        if (status === "Completed" && !order.deliveryProofImage) {
            return res.status(400).json({
                success: false,
                message: "Delivery proof is required before admin approval"
            });
        }

    // ✅ If order is being cancelled, restore product stock
    if (status === "Cancelled" && previousStatus !== "Cancelled") {
      console.log(`📦 Restoring inventory for cancelled order ${id}`);
      
      // Restore stock for each item in the order
      for (const item of order.items) {
        if (item.product) {
          try {
            const product = await Product.findById(item.product);
            
            if (product) {
              // Add back the quantity that was ordered (using 'stock' field)
              product.stock += item.quantity;
              await product.save();
              
              console.log(`✅ Restored ${item.quantity} units to product: ${product.name} (New stock: ${product.stock})`);
            } else {
              console.warn(`⚠️ Product ${item.product} not found for restoration`);
            }
          } catch (error) {
            console.error(`❌ Error restoring product ${item.product}:`, error);
            // Continue with other products even if one fails
          }
        }
      }
    }

    // Update order status
    order.status = status;
        if (status === "Completed") {
            order.deliveryApprovedAt = new Date();
            order.deliveryApprovedBy = req.userId;
        }
    order.updatedAt = new Date();
    await order.save();

    // Emit socket event for real-time updates
    if (req.io && order.customer && order.customer.email) {
      req.io.to(order.customer.email).emit('order-status-updated', {
        orderId: order._id,
        status: order.status,
        updatedAt: order.updatedAt,
        previousStatus: previousStatus
      });

      console.log(`🔔 Status update notification sent to customer: ${order.customer.email}`);
    }

    res.status(200).json({ 
      success: true, 
      message: `Order status updated to ${status}${status === "Cancelled" ? " and inventory restored" : ""}`,
      order 
    });
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ✅ Manual inventory restoration endpoint (for emergency use)
export const restoreInventoryForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    if (order.status !== "Cancelled") {
      return res.status(400).json({ 
        success: false, 
        message: "Can only restore inventory for cancelled orders" 
      });
    }

    const restoredProducts = [];

    // Restore stock for each item
    for (const item of order.items) {
      if (item.product) {
        try {
          const product = await Product.findById(item.product);
          
          if (product) {
            product.stock += item.quantity; // ✅ Using 'stock' field
            await product.save();
            
            restoredProducts.push({
              productId: product._id,
              name: product.name,
              quantityRestored: item.quantity,
              newQuantity: product.stock
            });
            
            console.log(`✅ Restored ${item.quantity} units to product: ${product.name}`);
          }
        } catch (error) {
          console.error(`❌ Error restoring product ${item.product}:`, error);
        }
      }
    }

    res.status(200).json({ 
      success: true, 
      message: "Inventory restored successfully",
      restoredProducts 
    });
  } catch (error) {
    console.error("Error in restoreInventoryForOrder:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
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
        let customerEmail = req.user?.email;
        
        if (!customerEmail && req.query.email) {
            customerEmail = req.query.email;
        }
        
        if (!customerEmail) {
            return res.status(400).json({ message: "Customer email is required" });
        }
        
        const orders = await Order.find({ "customer.email": customerEmail })
            .populate('items.product', 'name price image category stock')
            .populate('driverAssigned', 'name email role')
            .sort({ createdAt: -1 });
        
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error in getCustomerOrders:", error);
        res.status(500).json({ message: "Server error while fetching customer orders" });
    }
};

// Get all possible order statuses
export const getOrderStatuses = async (req, res) => {
    try {
        const statuses = ["Pending", "Preparing Food", "Ready for Delivery", "Processing", "Delivered", "Completed", "Cancelled"];
        res.status(200).json(statuses);
    } catch (error) {
        console.error("Error in getOrderStatuses:", error);
        res.status(500).json({ message: "Server error while fetching order statuses" });
    }
};

// Assign driver to order
export const assignDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const driverId = req.body?.driverId || req.userId;

        if (!driverId) {
            return res.status(400).json({ message: "Driver ID is required" });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.driverAssigned && order.driverAssigned.toString() !== driverId) {
            return res.status(409).json({ message: "Order is already assigned to another driver" });
        }

        const driver = await User.findById(driverId);
        if (!driver || driver.role !== "driver") {
            return res.status(404).json({ message: "Driver not found" });
        }

        order.driverAssigned = driverId;
        if (order.status === "Ready for Delivery") {
            order.status = "Processing";
        }
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate('items.product', 'name price image category stock')
            .populate('driverAssigned', 'name email role');

        const io = req.app.get('io');
        if (io) {
            io.emit('order-assigned', { order: populatedOrder });
            console.log(`📡 Broadcasting order assignment: ${order._id}`);
        }

        res.status(200).json({ message: "Driver assigned successfully", order: populatedOrder });
    } catch (error) {
        console.error("Error in assignDriver:", error);
        res.status(500).json({ message: "Server error while assigning driver" });
    }
};

// Get driver's assigned orders
export const getDriverOrders = async (req, res) => {
    try {
        const driverId = req.userId;

        const orders = await Order.find({ driverAssigned: driverId })
            .populate('items.product', 'name price image category stock')
            .populate('driverAssigned', 'name email role')
            .sort({ createdAt: -1 });
        
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error in getDriverOrders:", error);
        res.status(500).json({ message: "Server error while fetching driver orders" });
    }
};

// ✅ Add rating to order
export const addOrderRating = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, feedback } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ 
                success: false,
                message: "Rating must be between 1 and 5" 
            });
        }

        if (!feedback || feedback.trim().length === 0) {
            return res.status(400).json({ 
                success: false,
                message: "Feedback is required" 
            });
        }

        if (feedback.length > 500) {
            return res.status(400).json({ 
                success: false,
                message: "Feedback must be 500 characters or less" 
            });
        }

        const order = await Order.findById(id).populate("customer", "email name");
        
        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: "Order not found" 
            });
        }

        if (req.user && order.customer.email !== req.user.email) {
            return res.status(403).json({ 
                success: false,
                message: "You can only rate your own orders" 
            });
        }

        if (order.status !== "Completed" && order.status !== "Delivered") {
            return res.status(400).json({ 
                success: false,
                message: "You can only rate completed or delivered orders" 
            });
        }

        if (order.hasRated) {
            return res.status(400).json({ 
                success: false,
                message: "You have already rated this order" 
            });
        }

        order.rating = rating;
        order.feedback = feedback.trim();
        order.hasRated = true;
        order.ratedAt = new Date();

        await order.save();

        console.log(`⭐ Order ${order._id} rated ${rating} stars by ${order.customer.name}`);

        res.status(200).json({ 
            success: true,
            message: "Thank you for your feedback!",
            order: {
                _id: order._id,
                rating: order.rating,
                feedback: order.feedback,
                hasRated: order.hasRated,
                ratedAt: order.ratedAt
            }
        });
    } catch (error) {
        console.error("Error in addOrderRating:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error while submitting rating" 
        });
    }
};

// Get all ratings for analytics
export const getAllRatings = async (req, res) => {
    try {
        const ratings = await Order.find({ 
            hasRated: true,
            rating: { $exists: true, $ne: null }
        })
        .select('_id rating feedback ratedAt customer status')
        .populate('customer', 'name email')
        .sort({ ratedAt: -1 });

        const averageRating = ratings.length > 0
            ? ratings.reduce((sum, order) => sum + order.rating, 0) / ratings.length
            : 0;

        const distribution = {
            1: ratings.filter(r => r.rating === 1).length,
            2: ratings.filter(r => r.rating === 2).length,
            3: ratings.filter(r => r.rating === 3).length,
            4: ratings.filter(r => r.rating === 4).length,
            5: ratings.filter(r => r.rating === 5).length
        };

        res.status(200).json({
            success: true,
            totalRatings: ratings.length,
            averageRating: parseFloat(averageRating.toFixed(2)),
            distribution,
            ratings
        });
    } catch (error) {
        console.error("Error in getAllRatings:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error while fetching ratings" 
        });
    }
};

// Driver submits delivery proof and marks order as delivered
export const submitDriverDeliveryProof = async (req, res) => {
    try {
        const { id } = req.params;
        const { deliveryProofImage } = req.body;

        if (req.role !== "driver") {
            return res.status(403).json({
                success: false,
                message: "Only drivers can submit delivery proof"
            });
        }

        if (!deliveryProofImage) {
            return res.status(400).json({
                success: false,
                message: "Delivery proof image is required"
            });
        }

        const order = await Order.findById(id)
            .populate("customer", "email name")
            .populate("driverAssigned", "name email role");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (!order.driverAssigned || order.driverAssigned._id.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this order"
            });
        }

        if (order.status !== "Processing") {
            return res.status(400).json({
                success: false,
                message: "Order must be Processing before marking delivered"
            });
        }

        const now = new Date();
        order.deliveryProofImage = deliveryProofImage;
        order.deliveryProofSubmittedAt = now;
        order.status = "Delivered";
        order.updatedAt = now;
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate('items.product', 'name price image category stock')
            .populate('driverAssigned', 'name email role');

        const io = req.app.get('io');
        if (io) {
            io.emit('order-updated', { order: populatedOrder });
            io.emit('order-assigned', { order: populatedOrder });
            if (order.customer?.email) {
                io.to(order.customer.email).emit('order-status-updated', {
                    orderId: order._id,
                    status: order.status,
                    updatedAt: order.updatedAt,
                    previousStatus: "Processing"
                });
            }
        }

        res.status(200).json({
            success: true,
            message: "Delivery proof submitted and order marked Delivered",
            order: populatedOrder
        });
    } catch (error) {
        console.error("Error in submitDriverDeliveryProof:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};