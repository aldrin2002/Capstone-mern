import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
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
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
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

  // Connect to socket and load messages
  useEffect(() => {
    if (!user) return;
    
    console.log("Current user:", user);
    console.log("Cookies available:", document.cookie);

    const fetchConversation = async () => {
      try {
        setIsLoading(true);
        // Get/create user's conversation
        const conversationRes = await axios.get(`${API_URL}/conversation`, { 
          withCredentials: true 
        });
        
        setConversation(conversationRes.data);
        
        // Fetch messages for this conversation
        const messagesRes = await axios.get(`${API_URL}/${conversationRes.data._id}`, {
          withCredentials: true
        });
        
        setMessages(messagesRes.data);
        setIsLoading(false);
        
        // Scroll to bottom after loading messages
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("Error fetching conversation:", error);
        toast.error("Failed to load conversation");
        setIsLoading(false);
      }
    };
    
    fetchConversation();
    connectSocket();
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [user]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const uploadAttachment = async () => {
    if (!attachment) return null;
    
    const formData = new FormData();
    formData.append('attachment', attachment);
    
    try {
      const response = await axios.post(`${API_URL}/attachment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      
      return response.data.filePath;
    } catch (error) {
      console.error("Error uploading attachment:", error);
      throw new Error("Failed to upload attachment");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !attachment) return;
    if (!conversation) {
      toast.error("Conversation not initialized");
      return;
    }
    
    // Check if socket is connected before trying to send
    if (!socketRef.current || !socketRef.current.connected) {
      toast.error("Not connected to chat server. Attempting to reconnect...");
      
      try {
        // Try to reconnect
        connectSocket();
        
        // Give some time for reconnection before failing
        setTimeout(() => {
          if (!socketRef.current || !socketRef.current.connected) {
            toast.error("Failed to connect to chat server. Please refresh the page.");
          } else {
            // If reconnected successfully, try sending the message again
            handleSubmit(e);
          }
        }, 2000);
      } catch (error) {
        console.error("Reconnection failed:", error);
        toast.error("Connection error. Please refresh the page.");
      }
      
      return;
    }
    
    try {
      setIsSending(true);
      
      // Upload attachment if any
      let attachmentPath = null;
      if (attachment) {
        attachmentPath = await uploadAttachment();
      }
      
      // Send message via socket
      socketRef.current.emit('send-message', {
        conversationId: conversation._id,
        content: newMessage,
        attachment: attachmentPath
      });
      
      // Clear form fields
      setNewMessage("");
      setAttachment(null);
      setAttachmentPreview(null);
      
      // Ensure scroll to bottom after sending
      setTimeout(scrollToBottom, 100);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Extract the connect socket function so it can be reused
  const connectSocket = () => {
    try {
      // Get the token from localStorage or from the authenticated user
      const token = localStorage.getItem('token');
      console.log("Customer Socket connection - token available:", !!token);
      
      if (!token) {
        console.error("No auth token found - cannot establish socket connection");
        toast.error("Authentication required for messaging");
        return false;
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      // Connect with explicit token in auth object
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });
      
      // Add event handlers to debug connection issues
      socketRef.current.on('connect', () => {
        console.log("Customer socket connected successfully with ID:", socketRef.current.id);
        setIsConnected(true);
        toast.success("Connected to chat server", { duration: 2000 });
      });
      
      socketRef.current.on('connect_error', (err) => {
        console.error("Socket connection error:", err.message);
        setIsConnected(false);
        toast.error(`Connection error: ${err.message}`);
      });
      
      socketRef.current.on('disconnect', () => {
        console.log("Socket disconnected, trying to reconnect...");
        setIsConnected(false);
        toast.error("Disconnected from chat server. Reconnecting...", { duration: 3000 });
      });
      
      // Add listener for new messages
      socketRef.current.on('new-message', (message) => {
        console.log("New message received:", message);
        setMessages(prevMessages => {
          // Check if message already exists to prevent duplicates
          if (prevMessages.some(m => m._id === message._id)) return prevMessages;
          return [...prevMessages, message];
        });
      });
      
      // Add listener for messages being read
      socketRef.current.on('messages-read', (data) => {
        if (data.by !== 'customer') {
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.sender.role === 'customer' ? { ...msg, isRead: true } : msg
            )
          );
        }
      });

      // Add typing indicator
      socketRef.current.on('admin-typing', (isTyping) => {
        setAdminTyping(isTyping);
      });
      
      return true;
    } catch (error) {
      console.error("Error in socket connection setup:", error);
      toast.error("Failed to set up chat connection");
      return false;
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('customer-typing', true);
      
      // Clear existing timeout
      if (typingTimeout) clearTimeout(typingTimeout);
      
      // Set new timeout to stop typing indicator after 2 seconds of inactivity
      const timeout = setTimeout(() => {
        socketRef.current.emit('customer-typing', false);
      }, 2000);
      
      setTypingTimeout(timeout);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("File size too large (max 5MB)");
        return;
      }
      
      setAttachment(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
          className="flex-1 overflow-y-auto p-4 relative"
          style={{ 
            scrollbarWidth: "thin",
            scrollbarColor: "#cbd5e0 #f7fafc",
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
              {adminTyping && (
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
              className="fixed bottom-24 right-6 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-all"
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
            zIndex: 30
          } : {}}
        >
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Attachment preview if any */}
            {attachmentPreview && (
              <div className="mb-2 relative inline-block">
                <img 
                  src={attachmentPreview} 
                  alt="Attachment preview" 
                  className="h-20 w-auto rounded border border-gray-300" 
                />
                <button 
                  type="button"
                  onClick={() => {
                    setAttachment(null);
                    setAttachmentPreview(null);
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
                  isSending || (!newMessage.trim() && !attachment)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={isSending || (!newMessage.trim() && !attachment)}
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