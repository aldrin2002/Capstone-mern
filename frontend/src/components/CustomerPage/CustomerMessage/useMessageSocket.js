import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

export const useMessageSocket = (user, socket, conversation) => {
  useEffect(() => {
    if (!user) return;
    
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No auth token found for socket connection");
      return;
    }
    
    // Create socket connection
    const socketUrl = import.meta.env.MODE === "development" 
      ? "http://localhost:5000" 
      : "";
      
    if (!socket) {
      const newSocket = io(socketUrl, {
        auth: { token },
        withCredentials: true
      });
      
      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        window.messageSocket = newSocket; // Store in global for other components
      });
      
      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
        toast.error("Chat connection error. Please refresh the page.");
      });
      
      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (window.messageSocket) {
        window.messageSocket.disconnect();
      }
    };
  }, [user]);
};