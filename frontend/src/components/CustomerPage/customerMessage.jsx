import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import CustomerSideNav from "../../pages/customer/customerSideNav";
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
        timeout: 10000
      });
      
      // Add event handlers to debug connection issues
      socketRef.current.on('connect', () => {
        console.log("Customer socket connected successfully with ID:", socketRef.current.id);
        toast.success("Connected to chat server");
        
        // Request admin online status immediately after connecting
        socketRef.current.emit('check-admin-status');
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
        setMessages(prevMessages => [...prevMessages, message]);
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
      
      return true; // Return true to indicate connection attempt was made
    } catch (error) {
      console.error("Error in socket connection setup:", error);
      toast.error("Failed to set up chat connection");
      return false;
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
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Sidebar */}
      <CustomerSideNav />

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center">
            <div className="mr-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Customer Support</h1>
              <div className="flex items-center text-sm text-gray-500">
                <span className={`w-2 h-2 rounded-full mr-1.5 ${onlineAdmins > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span>{onlineAdmins > 0 ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
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

        {/* Message Input */}
        <div className="border-t border-gray-200 bg-white p-4">
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Attachment Preview */}
            {attachmentPreview && (
              <div className="mb-3 relative inline-block">
                <img 
                  src={attachmentPreview} 
                  alt="Attachment preview" 
                  className="h-20 rounded-md border border-gray-300"
                />
                <button 
                  type="button"
                  onClick={() => {
                    setAttachment(null);
                    setAttachmentPreview(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            {/* Message Input and Buttons */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent outline-none"
                />
                <div className="flex space-x-2 text-gray-400">
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current.click()}
                    className="hover:text-blue-500"
                  >
                    <Image size={18} />
                  </button>
                </div>
              </div>
              <button 
                type="submit" 
                className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 flex-shrink-0 disabled:bg-blue-400"
                disabled={isSending || (!newMessage.trim() && !attachment)}
              >
                {isSending ? (
                  <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                ) : (
                  <Send size={18} />
                )}
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