import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import { connectDB } from "./db/connectDB.js";
import { Message } from "./models/message.model.js";
import { Conversation } from "./models/conversation.model.js";
import { User } from "./models/user.model.js";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import galleryRoutes from "./routes/gallery.routes.js";
import orderRoutes from "./routes/order.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import userRoutes from "./routes/user.routes.js";
import messageRoutes from "./routes/message.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server and Socket.IO instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? true : "http://localhost:5173",
    credentials: true, // Make sure this is enabled
  }
});

// Add this after creating the io instance
app.set('io', io);

// Set up paths - combining both approaches
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);      // For ES modules support
const projectRoot = path.resolve();              // For absolute project root

// Create path to uploads - in the project root
const uploadsDir = path.join(projectRoot, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory at:', uploadsDir);
}

app.use(cors({ 
    origin: process.env.NODE_ENV === "production" ? true : "http://localhost:5173", 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files from project root uploads directory
app.use('/uploads', express.static(uploadsDir));
console.log('Serving uploads from:', uploadsDir);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

// Socket.IO connection handling
const connectedUsers = new Map();
const adminSockets = new Set();
const onlineCustomers = new Set();

// Add this function to broadcast online customers to admins
const broadcastOnlineCustomers = () => {
  // Convert Set to Array for sending via socket
  const onlineCustomersList = Array.from(onlineCustomers);
  
  // Send to all admin sockets
  adminSockets.forEach(socketId => {
    io.to(socketId).emit('customer-status-update', {
      customers: onlineCustomersList
    });
  });
  
  // Alternative: broadcast to admin room
  io.to('admin-room').emit('customer-status-update', {
    customers: onlineCustomersList
  });
  
  console.log(`Broadcasted online customers update: ${onlineCustomersList.length} customers online`);
};

// Socket.IO middleware for authentication
io.use((socket, next) => {
  try {
    // Try to get token from socket.handshake.auth.token
    const authToken = socket.handshake.auth.token;
    
    // If no explicit token, try to get it from cookies
    if (!authToken && socket.request.headers.cookie) {
      const cookies = socket.request.headers.cookie.split('; ').reduce((acc, cookie) => {
        const [key, value] = cookie.split('=');
        acc[key] = value;
        return acc;
      }, {});
      
      if (cookies.token) {
        // Verify the cookie token
        const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.role = decoded.role || "customer";
        console.log(`Socket authenticated via cookie: User ${decoded.userId}`);
        return next();
      }
    } else if (authToken) {
      // Verify the auth token
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.role = decoded.role || "customer";
      console.log(`Socket authenticated via auth object: User ${decoded.userId}`);
      return next();
    }
    
    return next(new Error("Authentication required"));
  } catch (error) {
    console.error("Socket auth error:", error.message);
    return next(new Error("Invalid authentication"));
  }
});

io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.id}, Role: ${socket.role}`);
  
  try {
    const user = await User.findById(socket.userId).select("name role");
    
    if (!user) {
      socket.disconnect();
      return;
    }
    
    // Store user connection
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      name: user.name,
      role: user.role
    });
    
    // FIXED: Consistent room joining pattern
    if (user.role === 'admin') {
      adminSockets.add(socket.id);
      // Add admins to a special room for broadcasting
      socket.join('admin-room');
      console.log(`Admin ${user.name} joined admin-room`);
      
      // Admin joins ALL conversation rooms to receive all messages
      const conversations = await Conversation.find().select('_id customer');
      conversations.forEach(conv => {
        socket.join(`conversation-${conv._id}`);
        console.log(`Admin joined room: conversation-${conv._id}`);
      });
      
      // Emit counts
      io.emit('admin-online-count', adminSockets.size);
      socket.emit('customer-status-update', {
        customers: Array.from(onlineCustomers)
      });
    } 
    else if (user.role === 'customer') {
      onlineCustomers.add(socket.userId);
      
      // Customer joins their specific conversation room
      const conversation = await Conversation.findOne({ customer: socket.userId });
      if (conversation) {
        socket.join(`conversation-${conversation._id}`);
        console.log(`Customer joined room: conversation-${conversation._id}`);
      }
      
      broadcastOnlineCustomers();
    }
    
    // Even simpler - just use room broadcasting
    socket.on('send-message', async (data) => {
      try {
        const { conversationId, content, attachment } = data;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit('error', { message: "Conversation not found" });
          return;
        }
        
        // Create new message
        const newMessage = new Message({
          sender: {
            id: socket.userId,
            name: user.name,
            role: user.role
          },
          content,
          attachment,
          conversation: conversationId,
          isRead: user.role === 'admin'
        });
        
        await newMessage.save();
        
        // Update conversation
        conversation.lastMessage = new Date();
        conversation.lastMessageContent = content || 'Image';
        conversation.lastMessageSender = user.role;
        
        if (user.role === 'customer') {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }
        
        await conversation.save();
        
        // SIMPLE: Just emit to the conversation room
        const roomName = `conversation-${conversationId}`;
        console.log(`📢 Broadcasting message to room: ${roomName}`);
        io.to(roomName).emit('new-message', newMessage);
        
        console.log(`✅ Message sent to room ${roomName}`);
        
      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('error', { message: "Failed to send message" });
      }
    });
    
    // Mark messages as read
    socket.on('mark-read', async (data) => {
      try {
        const { conversationId } = data;
        
        await Message.updateMany(
          { 
            conversation: conversationId,
            'sender.role': user.role === 'admin' ? 'customer' : 'admin',
            isRead: false
          },
          { isRead: true }
        );
        
        // Reset unread count if admin is marking as read
        if (user.role === 'admin') {
          await Conversation.findByIdAndUpdate(
            conversationId,
            { unreadCount: 0 }
          );
        }
        
        // Notify conversation room that messages were read
        io.to(`conversation-${conversationId}`).emit('messages-read', {
          conversationId,
          by: user.role
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });
    
    // Handle customer typing indicator
    socket.on('customer-typing', async (isTyping) => {
      try {
        // Only proceed if the socket is authenticated as a customer
        if (socket.role !== 'customer') return;
        
        const user = await User.findById(socket.userId).select("name");
        if (!user) return;
        
        // Find the conversation for this customer
        const conversation = await Conversation.findOne({ customer: socket.userId });
        if (!conversation) return;
        
        // Broadcast typing status to all admin sockets with conversation ID
        adminSockets.forEach(socketId => {
          io.to(socketId).emit('customer-typing', {
            customerId: socket.userId,
            conversationId: conversation._id,
            isTyping
          });
        });
        
        console.log(`Customer ${user.name} ${isTyping ? 'started' : 'stopped'} typing`);
      } catch (error) {
        console.error('Error in customer-typing event:', error);
      }
    });
    
    // Handle admin typing indicator
    socket.on('admin-typing', async ({ conversationId, isTyping }) => {
      try {
        // Only proceed if the socket is authenticated as an admin
        if (socket.role !== 'admin') return;
        
        // Get the conversation to find the customer
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.customer) return;
        
        // Emit typing event to specific customer's conversation room
        io.to(`conversation-${conversation.customer}`).emit('admin-typing', isTyping);
        
        console.log(`Admin is ${isTyping ? 'typing to' : 'stopped typing to'} customer ${conversation.customer}`);
      } catch (err) {
        console.error('Error in admin-typing event:', err);
      }
    });
    
    // Handle explicit room joining
    socket.on('join-conversation', (conversationId) => {
      if (conversationId) {
        socket.join(`conversation-${conversationId}`);
        console.log(`Socket ${socket.id} joined room: conversation-${conversationId}`);
      }
    });
    
    // Update the disconnect handler to track customer status
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      connectedUsers.delete(socket.userId);
      
      if (socket.role === 'admin') {
        adminSockets.delete(socket.id);
        io.emit('admin-online-count', adminSockets.size);
      } else if (socket.role === 'customer') {
        onlineCustomers.delete(socket.userId);
        // Broadcast updated online customers to admins
        broadcastOnlineCustomers();
      }
    });
    
  } catch (error) {
    console.error('Socket connection error:', error);
    socket.disconnect();
  }
});

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Backend server is running!' });
});

if (process.env.NODE_ENV === "production") {
    // Use the __dirname for relative paths within the backend
    // and projectRoot for absolute paths from project root
    app.use(express.static(path.join(projectRoot, "/frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(projectRoot, "frontend", "dist", "index.html"));
    });
}

// Use httpServer instead of app for listening
httpServer.listen(PORT, () => {
    connectDB();
    console.log("Server is running on port:", PORT);
});