import { createContext, useState, useContext, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { audioService } from "../utils/audioService";

const CustomerMessageContext = createContext();

export const useCustomerMessages = () => {
  return useContext(CustomerMessageContext);
};

export const CustomerMessageProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [adminOnlineCount, setAdminOnlineCount] = useState(0);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnMessagesPage, setIsOnMessagesPage] = useState(false);
  const { user } = useAuthStore();

  // Fetch unread messages count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const API_BASE_URL = import.meta.env.MODE === "development" 
        ? "http://localhost:5000" 
        : "";
      
      const response = await axios.get(`${API_BASE_URL}/api/messages/unread-count`, { 
        withCredentials: true 
      });
      
      setUnreadCount(response.data.count);
      console.log("📊 Unread count fetched:", response.data.count);
    } catch (error) {
      console.error("Error fetching unread messages count:", error);
    }
  }, [user]);

  // Reset unread counter
  const resetUnreadCount = useCallback(async () => {
    setUnreadCount(0);
    
    try {
      const API_BASE_URL = import.meta.env.MODE === "development" 
        ? "http://localhost:5000" 
        : "";
      
      await axios.post(`${API_BASE_URL}/api/messages/mark-all-read`, {}, { 
        withCredentials: true 
      });
      console.log("🔔 Marked all messages as read on backend");
    } catch (error) {
      console.error("❌ Error marking messages as read:", error);
    }
  }, []);

  // Connect socket on provider mount or when user changes
  useEffect(() => {
    if (!user || user.role !== "customer") return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const socketUrl = import.meta.env.MODE === "development" 
      ? "http://localhost:5000" 
      : "";
    
    const newSocket = io(socketUrl, {
      auth: { token },
      withCredentials: true
    });
    
    newSocket.on("connect", () => {
      console.log("🔌 Customer Socket connected:", newSocket.id);
      setIsConnected(true);
      fetchUnreadCount();
    });
    
    newSocket.on("disconnect", () => {
      console.log("🔌 Customer Socket disconnected");
      setIsConnected(false);
    });

    // Admin online status
    newSocket.on("admin-online-count", (count) => {
      console.log("👨‍💼 Admin online count:", count);
      setAdminOnlineCount(count);
    });
    
    // Admin typing indicator
    newSocket.on("admin-typing", (isTyping) => {
      setIsAdminTyping(isTyping);
    });

    // New message notification
    newSocket.on("new-message", (message) => {
      console.log("🔔 New message received in customer context:", message);
      
      // FIXED: Play notification for ALL incoming admin messages, regardless of page
      // But only increment counter when not on messages page
      if (message.sender.role === 'admin') {
        // Always play notification sound for received messages
        console.log("🔊 Playing notification for new admin message");
        audioService.playNotification();
        
        // Only increment unread counter when NOT on messages page
        if (!isOnMessagesPage) {
          setUnreadCount(prevCount => {
            const newCount = prevCount + 1;
            console.log("🔔 Incremented unread count to:", newCount);
            return newCount;
          });
        }
      }
    });

    setSocket(newSocket);
    
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user, isOnMessagesPage, fetchUnreadCount]);

  // Track if user is on messages page
  const setMessagesPageActive = useCallback((isActive) => {
    console.log("🔔 Messages page active status:", isActive);
    setIsOnMessagesPage(isActive);
    
    // Reset count immediately when entering messages page
    if (isActive) {
      resetUnreadCount();
    }
  }, [resetUnreadCount]);

  const value = {
    socket,
    isConnected,
    adminOnlineCount,
    isAdminTyping,
    unreadCount,
    resetUnreadCount,
    setMessagesPageActive
  };

  return (
    <CustomerMessageContext.Provider value={value}>
      {children}
    </CustomerMessageContext.Provider>
  );
};