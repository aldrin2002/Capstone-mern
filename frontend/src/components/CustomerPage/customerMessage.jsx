import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import CustomerSideNav, { MOBILE_NAV_HEIGHT } from "../../pages/customer/customerSideNav";
import { useAuthStore } from "../../store/authStore";
import { 
  Send, 
  User, 
  Clock, 
  MoreVertical, 
  Paperclip, 
  Image, 
  X, 
  ChevronDown
} from "lucide-react";
import { io } from "socket.io-client";

// API URLs
const API_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
const API_URL = `${API_BASE_URL}/api/messages`;
const SOCKET_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : window.location.origin;

const CustomerMessage = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [conversation, setConversation] = useState(null);
  const [adminTyping, setAdminTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [adminOnlineCount, setAdminOnlineCount] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user } = useAuthStore();
  
  // Helper function for formatting dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add scroll detection for showing/hiding scroll button
  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        setShowScrollButton(!atBottom);
      }
    };
    
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Auto-scroll to bottom of messages but only if already near bottom
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
      
      if (isNearBottom) {
        scrollToBottom();
      } else if (showScrollButton === false) {
        // Only update if we're not already showing the button
        setShowScrollButton(true);
      }
    }
  }, [messages]);

  // Initialize socket connection
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
      
    const newSocket = io(socketUrl, {
      auth: { token },
      withCredentials: true
    });
    
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
    });
    
    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      toast.error("Chat connection error. Please refresh the page.");
      setIsConnected(false);
    });
    
    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });
    
    newSocket.on("admin-online-count", (count) => {
      console.log("Admin online count:", count);
      setAdminOnlineCount(count);
    });
    
    newSocket.on("admin-typing", (isTyping) => {
      setIsAdminTyping(isTyping);
    });
    
    newSocket.on("new-message", (message) => {
      console.log("New message received:", message);
      setMessages((prev) => [...prev, message]);
      
      // Mark admin messages as read immediately
      if (message.sender.role === "admin" && conversation) {
        newSocket.emit("mark-read", { conversationId: conversation._id });
      }
    });
    
    setSocket(newSocket);
    
    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user]);
  
  // Load conversation and messages
  useEffect(() => {
    if (!user) return;
    
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
      } catch (error) {
        console.error("Error loading conversation:", error);
        toast.error("Failed to load chat. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConversation();
  }, [user, socket]);
  
  // Handle typing status
  const handleTyping = () => {
    if (!socket || !isConnected) return;
    
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
    
    if (!socket || !isConnected || !conversation) {
      toast.error("Not connected to chat. Please refresh the page.");
      return;
    }
    
    if (!newMessage.trim() && !imageFile) {
      return;
    }
    
    try {
      let attachment = null;
      
      // Upload image if exists
      if (imageFile) {
        const formData = new FormData();
        formData.append("attachment", imageFile);
        
        console.log("Uploading attachment to:", `${API_URL}/attachment`);
        const uploadRes = await axios.post(
          `${API_URL}/attachment`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true
          }
        );
        
        console.log("Upload response:", uploadRes.data);
        attachment = uploadRes.data.filePath;
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
      if (error.response && error.response.status === 500) {
        console.error("Server error details:", error.response.data);
        toast.error("Server error uploading image. Please try again.");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
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
  
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    // Make the outer container fixed height with no scrolling
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar - fixed height, no scroll */}
      <CustomerSideNav />

      {/* Main Content - fixed height with proper internal scrolling */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        {/* Header - fixed at top */}
        <div className="bg-blue-900 text-white p-4 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Store Owner</h1>
            <div className="flex items-center">
              <span className={`inline-block h-2 w-2 rounded-full mr-1.5 ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`}></span>
              <p className="text-sm">
                {isConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Container - only this part scrolls */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 relative pb-16"
          style={{ 
            scrollbarWidth: "thin",
            scrollbarColor: "#cbd5e0 #f7fafc",
            paddingBottom: isMobile ? "120px" : "80px" // Add extra padding at bottom to prevent messages from being hidden behind input
          }}
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Send className="h-8 w-8 text-blue-500" />
              </div>
              <p>No messages yet</p>
              <p className="text-sm mt-1">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Group messages by date */}
              {Object.entries(
                messages.reduce((groups, message) => {
                  const date = new Date(message.timestamp || message.createdAt).toDateString();
                  if (!groups[date]) groups[date] = [];
                  groups[date].push(message);
                  return groups;
                }, {})
              ).map(([date, dateMessages]) => (
                <div key={date}>
                  <div className="flex justify-center my-4">
                    <span className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                      {formatDate(date)}
                    </span>
                  </div>
                  
                  {/* Group consecutive messages by same sender */}
                  {dateMessages.reduce((groups, message, index) => {
                    const prevMessage = dateMessages[index - 1];
                    const sameAsPrev = prevMessage && 
                      prevMessage.sender.role === message.sender.role && 
                      (new Date(message.createdAt) - new Date(prevMessage.createdAt)) < 300000; // 5 minutes
                      
                    if (sameAsPrev) {
                      groups[groups.length - 1].push(message);
                    } else {
                      groups.push([message]);
                    }
                    return groups;
                  }, []).map((group, groupIndex) => {
                    const isCustomer = group[0].sender.role === 'customer';
                    
                    return (
                      <div 
                        key={groupIndex} 
                        className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} mb-4`}
                      >
                        {!isCustomer && (
                          <div className="h-8 w-8 rounded-full bg-blue-500 flex-shrink-0 mr-2 mt-1 flex items-center justify-center">
                            <User size={16} className="text-white" />
                          </div>
                        )}
                        
                        <div className="max-w-[75%]">
                          <div className="space-y-1">
                            {group.map((message) => (
                              <div
                                key={message._id} 
                                className={`rounded-lg px-4 py-2 relative ${
                                  isCustomer 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                                }`}
                              >
                                {message.attachment && (
                                  <div className="mb-2">
                                    <img 
                                      src={message.attachment.startsWith('data:') ? message.attachment : `${API_BASE_URL}${message.attachment}`}
                                      alt="Attachment" 
                                      className="rounded-md max-h-60 max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(
                                        message.attachment.startsWith('data:') 
                                          ? message.attachment 
                                          : `${API_BASE_URL}${message.attachment}`, 
                                        '_blank'
                                      )}
                                    />
                                  </div>
                                )}
                                <p>{message.content}</p>
                                <div 
                                  className={`flex items-center text-xs mt-1 ${
                                    isCustomer ? 'text-blue-100 justify-end' : 'text-gray-500'
                                  }`}
                                >
                                  <Clock size={12} className="mr-1" />
                                  <span>{formatTime(message.timestamp || message.createdAt)}</span>
                                  
                                  {isCustomer && (
                                    <span 
                                      className={`material-symbols-outlined ml-1 text-sm ${
                                        message.isRead ? 'text-blue-100' : 'text-blue-300'
                                      }`}
                                      title={message.isRead ? "Read" : "Delivered"}
                                      style={{ fontSize: "14px" }} // Match the previous icon size
                                    >
                                      done_all
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {isCustomer && (
                          <div className="h-8 w-8 rounded-full bg-blue-600 flex-shrink-0 ml-2 mt-1 flex items-center justify-center">
                            <User size={16} className="text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Typing indicator */}
              {isAdminTyping && (
                <div className="flex items-center mt-2">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex-shrink-0 mr-2 flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="bg-gray-200 rounded-lg px-4 py-2 text-gray-500 inline-block">
                    <div className="flex items-center">
                      <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce mr-1" style={{ animationDelay: "0ms" }}></span>
                      <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce mr-1" style={{ animationDelay: "300ms" }}></span>
                      <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Scroll reference element */}
              <div ref={messagesEndRef} />
            </div>
          )}
          
          {/* Scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="fixed bottom-32 md:bottom-24 right-6 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-all z-20"
            >
              <ChevronDown size={24} />
            </button>
          )}
        </div>

        {/* Input Area - fixed at bottom */}
        <div 
          className="bg-white border-t border-gray-200 p-4 shrink-0 z-10"
          style={isMobile ? { 
            position: "fixed", 
            bottom: `${MOBILE_NAV_HEIGHT}px`, 
            left: 0, 
            right: 0,
            zIndex: 30,
            boxShadow: "0 -2px 10px rgba(0,0,0,0.05)"
          } : {}}
        >
          <form onSubmit={handleSendMessage} className="flex flex-col">
            {/* Attachment preview if any */}
            {imagePreview && (
              <div className="mb-2 relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="Attachment preview" 
                  className="h-20 w-auto rounded border border-gray-300" 
                />
                <button 
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
                {/* File input button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Paperclip size={20} />
                </button>
                
                {/* Message input */}
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type your message..."
                  className="flex-1 border-0 focus:ring-0 focus:outline-none"
                  disabled={isSending}
                />
              </div>
              
              {/* Send button */}
              <button
                type="submit"
                className={`rounded-lg p-3 text-white ${
                  isSending || (!newMessage.trim() && !imageFile)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={isSending || (!newMessage.trim() && !imageFile)}
              >
                <Send size={20} />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </form>
        </div>
      </main>
    </div>
  );
};

export default CustomerMessage;