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
    
    // If admin, add to admin sockets set
    if (user.role === 'admin') {
      adminSockets.add(socket.id);
      
      // Emit online admin count to ALL clients immediately
      io.emit('admin-online-count', adminSockets.size);
      
      // Also listen for explicit admin connection announcement
      socket.on('admin-connected', () => {
        console.log("Admin explicitly announced connection, broadcasting to all clients");
        io.emit('admin-online-count', adminSockets.size);
      });
    }
    
    // Always emit current admin count to the connecting client
    socket.emit('admin-online-count', adminSockets.size);
    
    // Join appropriate rooms
    if (user.role === 'customer') {
      // Join personal conversation room
      socket.join(`conversation-${socket.userId}`);
    } else if (user.role === 'admin') {
      // Admin joins all conversations
      const conversations = await Conversation.find().select('customer');
      conversations.forEach(conv => {
        socket.join(`conversation-${conv.customer}`);
      });
    }
    
    // Handle new message
    socket.on('send-message', async (data) => {
      try {
        const { conversationId, content, attachment } = data;
        
        // Get conversation
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
          isRead: user.role === 'admin' // Admin messages are automatically read
        });
        
        await newMessage.save();
        
        // Update conversation lastMessage time
        conversation.lastMessage = new Date();
        
        // Increment unread count if message is from customer
        if (user.role === 'customer') {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }
        
        await conversation.save();
        
        // Broadcast to conversation room
        io.to(`conversation-${conversation.customer}`).emit('new-message', newMessage);
        
        // If customer sent message, also notify admin about new message
        if (user.role === 'customer') {
          io.to('admin-notifications').emit('new-customer-message', {
            conversationId,
            customer: {
              id: conversation.customer,
              name: user.name
            },
            message: content
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
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
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      connectedUsers.delete(socket.userId);
      
      if (socket.role === 'admin') {
        adminSockets.delete(socket.id);
        io.emit('admin-online-count', adminSockets.size);
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