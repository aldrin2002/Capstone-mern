import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
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

const CustomerMessage = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [onlineAdmins, setOnlineAdmins] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = useAuthStore();
  
  // Mock data for initial UI
  const mockMessages = [
    {
      _id: "1",
      sender: { name: "Admin", role: "admin" },
      content: "Hello! How can I help you today?",
      timestamp: new Date(Date.now() - 3600000 * 2),
      isRead: true
    },
    {
      _id: "2",
      sender: { name: user?.name || "You", role: "customer" },
      content: "Hi! I have a question about my recent order.",
      timestamp: new Date(Date.now() - 3600000 * 1.8),
      isRead: true
    },
    {
      _id: "3", 
      sender: { name: "Admin", role: "admin" },
      content: "Sure, I'd be happy to help. Could you please provide your order number?",
      timestamp: new Date(Date.now() - 3600000 * 1.5),
      isRead: true
    },
    {
      _id: "4",
      sender: { name: user?.name || "You", role: "customer" },
      content: "It's #ORD-12345. I ordered a cappuccino and sandwich but received a latte instead.",
      timestamp: new Date(Date.now() - 3600000 * 1.3),
      isRead: true
    },
    {
      _id: "5",
      sender: { name: "Admin", role: "admin" },
      content: "I apologize for the mistake. I've checked your order and will arrange for the correct item to be delivered to you today. Would that work for you?",
      timestamp: new Date(Date.now() - 3600000),
      isRead: true
    }
  ];

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

  // Load messages
  useEffect(() => {
    // Simulating API call to fetch messages
    const fetchMessages = async () => {
      try {
        // This would be replaced with actual API call when WebSocket is implemented
        // const apiUrl = "/api/messages";
        // const response = await axios.get(apiUrl);
        // setMessages(response.data);
        
        // For now, use mock data
        setTimeout(() => {
          setMessages(mockMessages);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
        setIsLoading(false);
      }
    };
    
    fetchMessages();
    
    // This would be where you connect to WebSocket
    // const socket = io(SOCKET_URL);
    // socket.on('message', (newMessage) => {
    //   setMessages(prev => [...prev, newMessage]);
    // });
    // socket.on('admin-online-count', (count) => {
    //   setOnlineAdmins(count);
    // });
    
    // Simulate admin count for demonstration
    setOnlineAdmins(1);
    
    // return () => {
    //   socket.disconnect();
    // };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !attachment) return;
    
    try {
      setIsSending(true);
      
      // In real implementation:
      // 1. Upload attachment if any
      // 2. Send message through WebSocket
      // 3. Optionally save to database via API
      
      // For demo, just simulate sending and receiving
      const outgoingMessage = {
        _id: `temp-${Date.now()}`,
        sender: { name: user?.name || "You", role: "customer" },
        content: newMessage,
        timestamp: new Date(),
        attachment: attachmentPreview,
        isRead: false
      };
      
      setMessages(messages => [...messages, outgoingMessage]);
      setNewMessage("");
      setAttachment(null);
      setAttachmentPreview(null);
      
      // Simulate admin response for demo purposes
      setTimeout(() => {
        const adminResponse = {
          _id: `admin-${Date.now()}`,
          sender: { name: "Admin", role: "admin" },
          content: "Thanks for your message! We'll get back to you soon.",
          timestamp: new Date(),
          isRead: true
        };
        setMessages(messages => [...messages, adminResponse]);
      }, 2000);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
                          src={message.attachment} 
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
                      <span>{formatTime(message.timestamp)}</span>
                      
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
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current.click()}
                    className="hover:text-blue-500"
                  >
                    <Paperclip size={18} />
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