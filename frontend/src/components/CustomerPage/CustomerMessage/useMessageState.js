import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../../store/authStore";
import { audioService } from "../../../utils/audioService"; // Add this import

// Update these functions to fix the issues
export const useMessageState = (API_URL, API_BASE_URL, socket, { autoCreate = true } = {}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user } = useAuthStore();
  
  // Set up message listener for this conversation
  useEffect(() => {
    if (!socket || !conversation) return;
    
    const handleNewMessage = (message) => {
      console.log("New message received in conversation:", message);
      
      // IMPORTANT: Check if this is our own message that we sent
      // by checking if we already have a message with the same content, sender and close timestamp
      if (message.sender.role === "customer" && message.sender.name === user.name) {
        // Check if we have a temporary message with same content
        const isDuplicate = messages.some(existingMsg => {
          // If content and attachment match, and was created within 5 seconds, consider it a duplicate
          const isContentMatch = existingMsg.content === message.content;
          const isAttachmentMatch = 
            (!existingMsg.attachment && !message.attachment) ||
            (existingMsg.attachment === message.attachment);
          const isRecentMessage = existingMsg._id.toString().startsWith('temp-');
          
          return isContentMatch && isAttachmentMatch && isRecentMessage;
        });
        
        if (isDuplicate) {
          console.log("Skipping duplicate message from server");
          // Update the temporary message with the real message ID
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              (msg._id.toString().startsWith('temp-') && 
               msg.content === message.content && 
               ((!msg.attachment && !message.attachment) || 
                (msg.attachment === message.attachment)))
                ? message
                : msg
            )
          );
          return;
        }
      }
      
      // If it's not a duplicate or it's from someone else, add it normally
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
  }, [socket, conversation, messages, user?.name]);
  
  // Load messages only when a conversation is already provided (order thread selected)
  useEffect(() => {
    const loadMessages = async () => {
      if (!user || !socket || !conversation) return;
      try {
        setIsLoading(true);
        const msgResponse = await axios.get(`${API_URL}/${conversation._id}`, { withCredentials: true });
        setMessages(msgResponse.data);
        socket.emit("mark-read", { conversationId: conversation._id });
        socket.emit('join-conversation', conversation._id);
        console.log(`Joined room: conversation-${conversation._id}`);
      } catch (error) {
        console.error("Failed to load messages", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMessages();
  }, [conversation, user, socket, API_URL]);
  
  // Handle typing status
  const handleTyping = () => {
    if (!socket || !conversation) return;
    
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("customer-typing", { conversationId: conversation._id, isTyping: true });
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("customer-typing", { conversationId: conversation._id, isTyping: false });
    }, 2000);
  };
  
  // Fix the handleFileChange function to properly reset
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Add the handleRemoveImage function
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fix the handleSendMessage function
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!socket || !conversation) {
      toast.error("Not connected to chat. Please refresh the page.");
      return;
    }
    
    // Check if we have either text or an image to send
    if (!newMessage.trim() && !imageFile) {
      return;
    }
    
    setIsSending(true);
    
    try {
      let attachment = null;
      
      // Upload image to Cloudinary if exists
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        
        console.log("Uploading attachment:", imageFile.name);
        
        const uploadUrl = `${API_BASE_URL}/api/orders/upload`;
        
        const uploadRes = await axios.post(
          uploadUrl,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          }
        );
        
        console.log("Upload response:", uploadRes.data);
        
        if (uploadRes.data.imagePath) {
          attachment = uploadRes.data.imagePath;
          console.log("Image uploaded successfully:", attachment);
        } else {
          throw new Error("Failed to upload image: Invalid response");
        }
        
        setUploadProgress(0);
      }
      
      // Use a non-empty content string for image-only messages
      const messageContent = newMessage.trim() || (attachment ? " " : "");
      
      // FIXED: Use socket instead of axios for sending messages
      // This matches your backend implementation that listens for socket events
      console.log("Sending message via socket:", {
        conversationId: conversation._id,
        content: messageContent,
        attachment
      });
      
      socket.emit("send-message", {
        conversationId: conversation._id,
        content: messageContent,
        attachment
      });
      
      // Add optimistic message to UI
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        content: messageContent,
        attachment: attachment,
        sender: {
          _id: user._id,
          name: user.name,
          role: "customer"
        },
        createdAt: new Date().toISOString(),
        isRead: false,
        conversation: conversation._id
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Clear inputs
      setNewMessage("");
      setImageFile(null);
      setImagePreview(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Stop typing indicator
      setIsTyping(false);
      socket.emit("customer-typing", { conversationId: conversation._id, isTyping: false });
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Return the new handleRemoveImage function
  return {
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    conversation,
    setConversation,
    isTyping,
    imageFile,
    imagePreview,
    setImagePreview,
    fileInputRef,
    handleTyping,
    handleSendMessage,
    handleFileChange,
    handleRemoveImage, // Export the new function
    uploadProgress
  };
};