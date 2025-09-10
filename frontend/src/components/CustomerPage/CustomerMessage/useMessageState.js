import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../../store/authStore";
import { audioService } from "../../../utils/audioService"; // Add this import

export const useMessageState = (API_URL, API_BASE_URL, socket) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user } = useAuthStore();
  
  // Set up message listener for this conversation
  useEffect(() => {
    if (!socket || !conversation) return;
    
    const handleNewMessage = (message) => {
      console.log("New message received in conversation:", message);
      setMessages((prev) => [...prev, message]);
      
      // Mark admin messages as read immediately
      if (message.sender.role === "admin" && conversation) {
        socket.emit("mark-read", { conversationId: conversation._id });
      }
    };
    
    // Listen for new messages
    socket.on("new-message", handleNewMessage);
    
    // Clean up listener when component unmounts or conversation changes
    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, [socket, conversation]);
  
  // Load conversation and messages
  useEffect(() => {
    if (!user || !socket) return;
    
    const fetchConversation = async () => {
      try {
        setIsLoading(true);
        // First, get or create conversation for this customer
        const convResponse = await axios.get(`${API_URL}/conversation`, {
          withCredentials: true
        });
        
        const conversationData = convResponse.data;
        setConversation(conversationData);
        
        // Then load messages for this conversation
        const msgResponse = await axios.get(
          `${API_URL}/${conversationData._id}`,
          { withCredentials: true }
        );
        
        setMessages(msgResponse.data);
        
        // Mark all admin messages as read
        if (socket && conversationData._id) {
          socket.emit("mark-read", { conversationId: conversationData._id });
        }
        
        // Join the conversation room
        socket.emit('join-conversation', conversationData._id);
        console.log(`Customer joined room: conversation-${conversationData._id}`);
        
      } catch (error) {
        console.error("Error loading conversation:", error);
        toast.error("Failed to load chat. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConversation();
  }, [user, socket, API_URL]);
  
  // Handle typing status
  const handleTyping = () => {
    if (!socket || !conversation) return;
    
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("customer-typing", true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("customer-typing", false);
    }, 2000);
  };
  
  // Handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!socket || !conversation) {
      toast.error("Not connected to chat. Please refresh the page.");
      return;
    }
    
    if (!newMessage.trim() && !imageFile) {
      return;
    }
    
    setIsSending(true);
    
    try {
      let attachment = null;
      
      // Upload image to Cloudinary if exists
      if (imageFile) {
        const formData = new FormData();
        formData.append("attachment", imageFile);
        formData.append("type", "message"); // Identify this as a message attachment
        
        console.log("Uploading to Cloudinary via:", `${API_URL}/attachment`);
        const uploadRes = await axios.post(
          `${API_URL}/attachment`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
              console.log(`Upload progress: ${percentCompleted}%`);
            }
          }
        );
        
        console.log("Cloudinary upload response:", uploadRes.data);
        
        // The backend should return a Cloudinary URL in the filePath property
        attachment = uploadRes.data.filePath || uploadRes.data.secure_url;
        
        // Reset upload progress
        setUploadProgress(0);
      }
      
      // Emit message via socket
      socket.emit("send-message", {
        conversationId: conversation._id,
        content: newMessage,
        attachment
      });
      
      // Clear inputs
      setNewMessage("");
      setImageFile(null);
      setImagePreview(null);
      
      // Stop typing indicator
      setIsTyping(false);
      socket.emit("customer-typing", false);
      
    } catch (error) {
      console.error("Error sending message:", error);
      if (error.response) {
        console.error("Server error details:", error.response.data);
        toast.error(error.response.data.error || "Failed to upload image. Please try again.");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.match("image.*")) {
      toast.error("Only image files are allowed");
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  return {
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    conversation,
    isTyping,
    imagePreview,
    imageFile,
    fileInputRef,
    uploadProgress,
    handleTyping,
    handleSendMessage,
    handleFileChange
  };
};