import { createContext, useState, useContext, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { audioService } from "../utils/audioService"; // Import audio service

const MessageNotificationContext = createContext();

export const useMessageNotifications = () => {
  return useContext(MessageNotificationContext);
};

export const MessageNotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOnMessagesPage, setIsOnMessagesPage] = useState(false);

  // Connect socket on provider mount
  useEffect(() => {
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
      console.log("🔌 Notification Socket connected:", newSocket.id);
      setIsConnected(true);
      fetchUnreadCount();
    });
    
    newSocket.on("disconnect", () => {
      console.log("🔌 Notification Socket disconnected");
      setIsConnected(false);
    });
    
    setSocket(newSocket);
    
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Separate useEffect for handling new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      console.log("🔔 New message received in notification context:", message);
      
      // Only increment counter for customer messages when NOT on messages page
      if (message.sender.role === 'customer') {
        if (!isOnMessagesPage) {
          console.log("🔔 Incrementing unread count (not on messages page)");
          setUnreadCount(prev => {
            const newCount = prev + 1;
            console.log("🔔 New unread count:", newCount);
            return newCount;
          });
          
          // REPLACED: Use centralized audio service
          audioService.playNotification();
        } else {
          console.log("🔔 On messages page - not incrementing count");
        }
      }
    };

    socket.on("new-message", handleNewMessage);
    
    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, [socket, isOnMessagesPage]);

  // Fetch initial unread count
  const fetchUnreadCount = async () => {
    try {
      const API_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
      const response = await axios.get(`${API_BASE_URL}/api/messages/unread-count`, { 
        withCredentials: true 
      });
      
      if (response.data && typeof response.data.count === 'number') {
        console.log("🔔 Fetched initial unread count:", response.data.count);
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error("❌ Error fetching unread count:", error);
      setUnreadCount(0);
    }
  };

  // IMPROVED: Reset unread count with backend sync
  const resetUnreadCount = useCallback(async () => {
    console.log("🔔 Resetting unread count to 0");
    setUnreadCount(0);
    
    // Optional: Sync with backend to mark messages as read
    try {
      const API_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
      await axios.post(`${API_BASE_URL}/api/messages/mark-all-read`, {}, { 
        withCredentials: true 
      });
      console.log("🔔 Marked all messages as read on backend");
    } catch (error) {
      console.error("❌ Error marking messages as read:", error);
    }
  }, []);

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
    unreadCount,
    resetUnreadCount,
    setMessagesPageActive,
    socket,
    isConnected
  };

  return (
    <MessageNotificationContext.Provider value={value}>
      {children}
    </MessageNotificationContext.Provider>
  );
};