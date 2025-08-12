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
  ChevronDown,
  Wifi,
  WifiOff,
  MessageCircle
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Sidebar */}
      <CustomerSideNav />

      {/* Main Content - Adjusted for fixed sidebar */}
      <main className={`h-screen flex flex-col overflow-hidden relative ${isMobile ? '' : 'ml-64'}`}>
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
        
        {/* Header - Enhanced with glassmorphism */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-4 shrink-0 shadow-lg backdrop-blur-xl border-b border-white/10">
          {/* Header background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Enhanced admin avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg border-2 border-white/20">
                  <User size={20} className="text-white" />
                </div>
              </div>
              
              <div>
                <h1 className="text-xl font-bold">Store Owner</h1>
                <p className="text-xs text-blue-100 flex items-center">
                  <MessageCircle size={12} className="mr-1" />
                  {adminOnlineCount > 0 ? 'Available to chat' : 'Offline'}
                </p>
              </div>
            </div>
            
            {/* Enhanced connection status */}
            <div className="flex items-center space-x-3">
              <div className={`flex items-center px-3 py-1.5 rounded-full ${
                isConnected 
                  ? 'bg-green-500/20 border border-green-400/30' 
                  : 'bg-red-500/20 border border-red-400/30'
              } backdrop-blur-sm`}>
                {isConnected ? (
                  <Wifi size={14} className="text-green-300 mr-1.5" />
                ) : (
                  <WifiOff size={14} className="text-red-300 mr-1.5" />
                )}
                <span className="text-xs font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Container - Enhanced with modern scrolling */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-6 relative"
          style={{ 
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(59, 130, 246, 0.3) transparent",
            paddingBottom: isMobile ? "160px" : "0px"
          }}  
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin animate-reverse"></div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg border border-white/50">
                  <Send className="h-12 w-12 text-blue-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <MessageCircle size={16} className="text-white" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-700 mb-2">No messages yet</p>
                <p className="text-sm text-gray-500">Start the conversation with the store owner!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
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
                  <div className="flex justify-center my-6">
                    <div className="relative">
                      <span className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium text-gray-600 shadow-lg border border-gray-200/50">
                        {formatDate(date)}
                      </span>
                    </div>
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
                        className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} mb-6 animate-fade-in`}
                      >
                        {!isCustomer && (
                          <div className="relative mr-3 mt-1">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg border-2 border-white">
                              <User size={16} className="text-white" />
                            </div>
                          </div>
                        )}
                        
                        <div className="max-w-[75%]">
                          <div className="space-y-2">
                            {group.map((message, index) => (
                              <div
                                key={message._id} 
                                className={`group relative animate-slide-in ${
                                  isCustomer ? 'animate-slide-in-right' : 'animate-slide-in-left'
                                }`}
                                style={{ animationDelay: `${index * 100}ms` }}
                              >
                                <div className={`relative rounded-2xl px-4 py-3 shadow-lg transform transition-all duration-300 hover:scale-[1.02] ${
                                  isCustomer 
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-lg ml-auto' 
                                    : 'bg-white/90 backdrop-blur-sm text-gray-800 rounded-bl-lg border border-gray-200/50'
                                }`}>
                                  {/* Message tail */}
                                  <div className={`absolute bottom-0 ${
                                    isCustomer 
                                      ? 'right-0 w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-blue-600' 
                                      : 'left-0 w-0 h-0 border-r-[12px] border-r-transparent border-t-[12px] border-t-white'
                                  }`}></div>
                                  
                                  {message.attachment && (
                                    <div className="mb-3 relative overflow-hidden rounded-xl">
                                      <img 
                                        src={message.attachment.startsWith('data:') ? message.attachment : `${API_BASE_URL}${message.attachment}`}
                                        alt="Attachment" 
                                        className="rounded-xl max-h-60 max-w-full cursor-pointer hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg"
                                        onClick={() => window.open(
                                          message.attachment.startsWith('data:') 
                                            ? message.attachment 
                                            : `${API_BASE_URL}${message.attachment}`, 
                                          '_blank'
                                        )}
                                      />
                                    </div>
                                  )}
                                  
                                  {message.content && (
                                    <p className="leading-relaxed">{message.content}</p>
                                  )}
                                  
                                  <div className={`flex items-center text-xs mt-2 ${
                                    isCustomer ? 'text-blue-100 justify-end' : 'text-gray-500'
                                  }`}>
                                    <Clock size={12} className="mr-1.5" />
                                    <span className="font-medium">{formatTime(message.timestamp || message.createdAt)}</span>
                                    
                                    {isCustomer && (
                                      <div className="ml-2 flex items-center">
                                        <div className={`w-3 h-3 rounded-full ${
                                          message.isRead ? 'bg-green-300' : 'bg-blue-300'
                                        } animate-pulse`}></div>
                                        <span className="ml-1 text-xs font-medium">
                                          {message.isRead ? "Read" : "Sent"}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {isCustomer && (
                          <div className="relative ml-3 mt-1">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg border-2 border-white">
                              <User size={16} className="text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Enhanced typing indicator */}
              {isAdminTyping && (
                <div className="flex items-center mt-4 animate-fade-in">
                  <div className="relative mr-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg border-2 border-white">
                      <User size={16} className="text-white" />
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl rounded-bl-lg px-5 py-3 text-gray-600 shadow-lg border border-gray-200/50">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <span className="ml-2 text-xs font-medium">Store owner is typing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Scroll reference element */}
              <div ref={messagesEndRef} />
            </div>
          )}
          
          {/* Enhanced scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="fixed bottom-32 md:bottom-28 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 z-20 border border-white/20 backdrop-blur-sm"
            >
              <ChevronDown size={20} />
            </button>
          )}
        </div>

        {/* Enhanced Input Area */}
        <div 
          className="relative bg-white/80 backdrop-blur-xl border-t border-white/20 p-4 shrink-0 z-10 shadow-lg"
          style={isMobile ? { 
            position: "fixed", 
            bottom: `${MOBILE_NAV_HEIGHT}px`, 
            left: 0, 
            right: 0,
            zIndex: 30,
            boxShadow: "0 -10px 30px rgba(0,0,0,0.1)"
          } : {}}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none"></div>
          
          <form onSubmit={handleSendMessage} className="relative flex flex-col max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              {/* Enhanced input container */}
              <div className="flex-1 relative">
                <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 hover:border-blue-300/50 focus-within:border-blue-500/50 shadow-lg hover:shadow-xl transition-all duration-300 px-4 py-3">
                  {/* Background gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  
                  {/* Enhanced message input */}
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-500 mx-3 font-medium"
                    disabled={isSending}
                  />
                  
                  {/* Typing indicator for current user */}
                  {isTyping && (
                    <div className="flex items-center space-x-1 mr-3">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Enhanced send button */}
              <button
                type="submit"
                className={`relative overflow-hidden rounded-2xl p-4 text-white font-medium shadow-lg transition-all duration-300 transform ${
                  isSending || (!newMessage.trim() && !imageFile)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-105 active:scale-95"
                }`}
                disabled={isSending || (!newMessage.trim() && !imageFile)}
              >
                {/* Button background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                
                {isSending ? (
                  <div className="relative w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send size={20} className="relative" />
                )}
              </button>
            </div>
            
            {/* Hidden file input - preserving functionality */}
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

      {/* Custom animations and styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.5s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out forwards;
        }
        
        .animate-reverse {
          animation-direction: reverse;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
};

export default CustomerMessage;