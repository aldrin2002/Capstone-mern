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
  CircleCheck
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
  const [onlineAdmins, setOnlineAdmins] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [conversation, setConversation] = useState(null);
  const [adminOnline, setAdminOnline] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);;
  const [isConnected, setIsConnected] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const { user } = useAuthStore();
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
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
      } catch (error) {
        console.error("Error fetching conversation:", error);
        toast.error("Failed to load conversation");
        setIsLoading(false);
      }
    };
    
    fetchConversation();
    connectSocket(); // Use the extracted function
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        connectSocket(); // We need to define this function outside useEffect
        
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
        return false; // Return false to indicate connection failure
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
        toast.success("Connected to chat server", { duration: 2000 });
        
        // Request admin online status immediately after connecting
        socketRef.current.emit('check-admin-status');
      });
      
      socketRef.current.on('connect_error', (err) => {
        console.error("Socket connection error:", err.message);
        toast.error(`Connection error: ${err.message}`);
      });
      
      socketRef.current.on('disconnect', () => {
        console.log("Socket disconnected, trying to reconnect...");
        toast.error("Disconnected from chat server. Reconnecting...", { duration: 3000 });
      });
      
      // Add listener for admin online status - improved
      socketRef.current.on('admin-online-count', (count) => {
        console.log("Admin online count received:", count);
        setOnlineAdmins(count);
        setAdminOnline(count > 0);
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
      
      return true; // Return true to indicate connection attempt was made
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
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <CustomerSideNav />

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="bg-blue-900 text-white p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Store Owner</h1>
            <div className="flex items-center">
              <span className={`inline-block h-2 w-2 rounded-full mr-1.5 ${
                socketRef.current?.connected ? 'bg-green-400' : 'bg-red-400'
              }`}></span>
              <p className="text-sm">
                {socketRef.current?.connected 
                  ? (onlineAdmins > 0 
                    ? `${onlineAdmins} admin${onlineAdmins > 1 ? 's' : ''} online` 
                    : 'No admins online')
                  : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Container - Add scroll area with padding */}
        <div 
          className="flex-1 overflow-y-auto p-4"
          style={{ paddingBottom: isMobile ? "8rem" : "1rem" }}
          ref={messagesEndRef}
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
              {messages.map((message) => (
                <div 
                  key={message._id} 
                  className={`flex ${message.sender.role === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`rounded-lg px-4 py-2 max-w-[80%] md:max-w-[70%] relative ${
                      message.sender.role === 'customer' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {message.attachment && (
                      <div className="mb-2">
                        <img 
                          src={message.attachment.startsWith('data:') ? message.attachment : `${API_BASE_URL}${message.attachment}`}
                          alt="Attachment" 
                          className="rounded-md max-h-60 max-w-full"
                        />
                      </div>
                    )}
                    <p>{message.content}</p>
                    <div 
                      className={`flex items-center text-xs mt-1 ${
                        message.sender.role === 'customer' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      <Clock size={12} className="mr-1" />
                      <span>{formatTime(message.timestamp || message.createdAt)}</span>
                      
                      {message.sender.role === 'customer' && (
                        <CircleCheck 
                          size={14} 
                          className={`ml-1 ${message.isRead ? 'text-blue-100' : 'text-blue-300'}`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Position above bottom nav */}
        <div 
          className="bg-white border-t border-gray-200 p-4"
          style={isMobile ? { 
            position: "fixed", 
            bottom: `${MOBILE_NAV_HEIGHT}px`, 
            left: 0, 
            right: 0,
            zIndex: 30
          } : {}}
        >
          <form onSubmit={handleSubmit} className="flex gap-2">
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
            
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
              {/* File input button */}
              <label className="cursor-pointer text-gray-500 hover:text-gray-700">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                />
                <Paperclip size={20} />
              </label>
              
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
              className={`rounded-lg px-4 py-2 text-white ${
                isSending || (!newMessage.trim() && !attachment)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={isSending || (!newMessage.trim() && !attachment)}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CustomerMessage;