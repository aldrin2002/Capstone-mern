import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import Swal from 'sweetalert2';
import { 
  Search, 
  Loader,
  MessageSquare,
  SearchX,
  ArrowLeft,
  Sparkles,
  Zap
} from "lucide-react";

// Import the new components
import ConversationItem from "./ConversationItem";
import MessagesList from "./MessagesList";
import MessageInput from "./MessageInput";
import EditMessageModal from "./EditMessageModal";

// API URLs
const API_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
const API_URL = `${API_BASE_URL}/api/messages`;
const SOCKET_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : window.location.origin;

const AdminMessage = () => {
  // State management
  const [conversations, setConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const conversationsContainerRef = useRef(null);

  // Additional state - simplified like CustomerMessage
  const [onlineCustomers, setOnlineCustomers] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [messageToEdit, setMessageToEdit] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [typingCustomers, setTypingCustomers] = useState({});
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // COPIED FROM CUSTOMER MESSAGE - simplified socket state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Helper functions
  const sortConversationsByLatest = (conversationsArray) => {
    return [...conversationsArray].sort((a, b) => {
      const dateA = new Date(a.lastMessage || a.createdAt);
      const dateB = new Date(b.lastMessage || b.createdAt);
      return dateB - dateA;
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

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

  const isCustomerOnline = (customerId) => {
    return onlineCustomers.includes(customerId);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // COPIED FROM CUSTOMER MESSAGE - Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // COPIED FROM CUSTOMER MESSAGE - Socket initialization
  useEffect(() => {
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
      console.log("Admin Socket connected:", newSocket.id);
      setIsConnected(true);
      setIsSocketConnected(true);
    });
    
    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      toast.error("Chat connection error. Please refresh the page.");
      setIsConnected(false);
      setIsSocketConnected(false);
    });
    
    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
      setIsSocketConnected(false);
    });
    
    // COPIED LOGIC - Simple message handling
    newSocket.on("new-message", (message) => {
      console.log("Admin received new message:", message);
      setMessages((prev) => [...prev, message]);
      
      // Update conversations list
      setConversations(prev => {
        const updatedConversations = prev.map(conv => {
          const convId = typeof conv._id === 'object' ? conv._id.toString() : String(conv._id);
          const messageConvId = message.conversation?._id || message.conversation;
          const messageConvString = typeof messageConvId === 'object' ? messageConvId.toString() : String(messageConvId);
          
          if (convId === messageConvString) {
            return { 
              ...conv, 
              lastMessage: new Date(),
              lastMessageContent: message.content || 'Image',
              lastMessageSender: message.sender.role,
              unreadCount: message.sender.role === 'customer' ? (conv.unreadCount || 0) + 1 : conv.unreadCount || 0
            };
          }
          return conv;
        });
        
        return sortConversationsByLatest(updatedConversations);
      });
      
      // Play notification for customer messages
      if (message.sender.role === 'customer') {
        try {
          const activeNotification = new Audio('/notification-subtle.mp3');
          activeNotification.volume = 0.3;
          activeNotification.play().catch(err => console.log("Audio play prevented:", err));
        } catch (error) {
          console.log("Audio error:", error);
        }
      }
    });
    
    // Handle customer typing
    newSocket.on("customer-typing", ({ customerId, isTyping }) => {
      setTypingCustomers(prev => ({
        ...prev,
        [customerId]: isTyping
      }));
    });
    
    // Handle customer status updates
    newSocket.on('customer-status-update', (data) => {
      if (data.customers) {
        setOnlineCustomers(data.customers);
      }
    });
    
    setSocket(newSocket);
    
    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // COPIED FROM CUSTOMER MESSAGE - Load conversations and messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/conversations`, { withCredentials: true });
        setConversations(sortConversationsByLatest(response.data || []));
        
        if (response.data.length > 0) {
          setSelectedConversation(response.data[0]);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;
      
      setIsLoadingMessages(true);
      
      try {
        const response = await axios.get(`${API_URL}/${selectedConversation._id}`, {
          withCredentials: true
        });
        
        setMessages(response.data || []);
        
        // Mark customer messages as read
        if (socket && selectedConversation._id) {
          socket.emit("mark-read", { conversationId: selectedConversation._id });
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConversation, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // COPIED FROM CUSTOMER MESSAGE - Handle typing
  const handleAdminTyping = () => {
    if (!socket || !isConnected) return;
    
    socket.emit("admin-typing", {
      conversationId: selectedConversation?._id,
      isTyping: true
    });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("admin-typing", {
        conversationId: selectedConversation?._id,
        isTyping: false
      });
    }, 2000);
  };

  // Event handlers
  const handleDeleteMessage = async (messageId, e) => {
    e.stopPropagation();
    
    const result = await Swal.fire({
      title: '🗑️ Delete Message?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '✨ Delete',
      cancelButtonText: '↩️ Cancel',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border-0',
        title: 'text-gray-800 font-bold',
        content: 'text-gray-600',
        confirmButton: 'rounded-xl font-semibold transform hover:scale-105 transition-all duration-200',
        cancelButton: 'rounded-xl font-semibold transform hover:scale-105 transition-all duration-200'
      }
    });
    
    if (result.isConfirmed) {
      try {
        setIsDeleting(true);
        
        if (messageId.toString().startsWith('temp-')) {
          setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
          
          Swal.fire({
            title: '✅ Deleted!',
            text: 'Message has been deleted',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            customClass: {
              popup: 'rounded-2xl shadow-2xl border-0',
              title: 'text-green-800 font-bold'
            }
          });
          return;
        }
        
        const response = await axios.delete(`${API_URL}/${messageId}`, {
          withCredentials: true
        });
        
        if (response.status === 200) {
          setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
          Swal.fire({
            title: '✅ Deleted!',
            text: 'Message has been deleted',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            customClass: {
              popup: 'rounded-2xl shadow-2xl border-0',
              title: 'text-green-800 font-bold'
            }
          });
        }
      } catch (error) {
        console.error("Error deleting message:", error);
        Swal.fire({
          title: '❌ Error!',
          text: 'Failed to delete message',
          icon: 'error',
          background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
          customClass: {
            popup: 'rounded-2xl shadow-2xl border-0',
            title: 'text-red-800 font-bold'
          }
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteConversation = async (conversationId, e) => {
    e.stopPropagation();
    
    const conversation = conversations.find(c => c._id === conversationId);
    const customerName = conversation?.customer?.name || 'this customer';
    
    const result = await Swal.fire({
      title: '🚨 Delete Entire Conversation?',
      text: `All messages with ${customerName} will be permanently deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '🗑️ Delete',
      cancelButtonText: '↩️ Cancel',
      background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border-0',
        title: 'text-red-800 font-bold',
        content: 'text-red-600',
        confirmButton: 'rounded-xl font-semibold transform hover:scale-105 transition-all duration-200',
        cancelButton: 'rounded-xl font-semibold transform hover:scale-105 transition-all duration-200'
      }
    });
    
    if (result.isConfirmed) {
      setIsDeleting(true);
      
      try {
        const response = await axios.delete(`${API_URL}/conversation/${conversationId}`, {
          withCredentials: true
        });
        
        if (response.status === 200) {
          setConversations(prev => prev.filter(conv => conv._id !== conversationId));
          
          if (selectedConversation && selectedConversation._id === conversationId) {
            setSelectedConversation(null);
            setMessages([]);
          }
          
          Swal.fire({
            title: '✅ Deleted!',
            text: 'Conversation has been deleted',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            customClass: {
              popup: 'rounded-2xl shadow-2xl border-0',
              title: 'text-green-800 font-bold'
            }
          });
        }
      } catch (error) {
        console.error("Error deleting conversation:", error);
        Swal.fire({
          title: '❌ Error!',
          text: 'Failed to delete conversation',
          icon: 'error',
          background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
          customClass: {
            popup: 'rounded-2xl shadow-2xl border-0',
            title: 'text-red-800 font-bold'
          }
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEditMessage = (message) => {
    setMessageToEdit(message);
    setEditedContent(message.content);
  };

  const handleSaveEdit = (message, content) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg._id === message._id 
          ? {...msg, content: content} 
          : msg
      )
    );
    setMessageToEdit(null);
  };

  // COPIED FROM CUSTOMER MESSAGE - Simplified message sending
  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    
    if (!socket || !isConnected || !selectedConversation) {
      toast.error("Not connected to chat. Please refresh the page.");
      return;
    }
    
    if (!newMessage.trim() && !attachment) {
      return;
    }
    
    try {
      let attachmentPath = null;
      
      // Upload attachment if exists
      if (attachment) {
        const formData = new FormData();
        formData.append("attachment", attachment);
        
        const uploadRes = await axios.post(
          `${API_URL}/attachment`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true
          }
        );
        
        attachmentPath = uploadRes.data.filePath;
      }
      
      // Emit message via socket
      socket.emit("send-message", {
        conversationId: selectedConversation._id,
        content: newMessage,
        attachment: attachmentPath
      });
      
      // Clear inputs
      setNewMessage("");
      setAttachment(null);
      setAttachmentPreview(null);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
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

  // Filter conversations
  const filteredConversations = conversations.filter(conv => 
    conv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`h-screen bg-gray-50 ${isMobile ? 'pb-16' : 'p-4'}`}>
      {/* Mobile header */}
      {isMobile && selectedConversation ? (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
          <div className="flex items-center h-14 px-4">
            <button 
              onClick={() => setSelectedConversation(null)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="ml-2 flex-1">
              <h2 className="font-medium truncate">{selectedConversation.customer?.name || 'Customer'}</h2>
              <p className="text-xs text-gray-500 truncate">{selectedConversation.customer?.email}</p>
            </div>
            {isCustomerOnline(selectedConversation.customer?._id) && (
              <span className="text-xs text-green-500 flex items-center">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                Active
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
            Messages
            {isSocketConnected && (
              <span className="ml-2 flex items-center text-sm font-normal text-green-600">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                Live
              </span>
            )}
          </h2>
        </div>
      )}

      {/* Main container */}
      <div className={`${isMobile ? 'h-[calc(100vh-4rem)]' : 'h-full'} bg-white shadow-sm flex`}>
        {/* Conversations sidebar */}
        <div className={`${
          isMobile && selectedConversation ? 'hidden' : 'w-full'
        } md:w-80 border-r border-gray-200 flex flex-col`}>
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations list */}
          <div 
            ref={conversationsContainerRef}
            className="flex-1 overflow-y-auto pt-3"
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader className="h-6 w-6 text-blue-500 animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <SearchX size={24} className="mb-2" />
                <p className="text-sm">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <ConversationItem
                  key={conv._id}
                  conversation={conv}
                  isSelected={selectedConversation?._id === conv._id}
                  isOnline={isCustomerOnline(conv.customer?._id)}
                  onSelect={setSelectedConversation}
                  onDelete={handleDeleteConversation}
                  formatTime={formatTime}
                  isMobile={isMobile}
                />
              ))
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className={`${
          isMobile && !selectedConversation ? 'hidden' : 'w-full'
        } md:flex-1 flex flex-col bg-gray-50`}>
          {selectedConversation ? (
            <>
              {/* Messages container */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 py-6"
              >
                <MessagesList
                  ref={messagesEndRef}
                  messages={messages}
                  isLoadingMessages={isLoadingMessages}
                  formatTime={formatTime}
                  formatDate={formatDate}
                  onDeleteMessage={handleDeleteMessage}
                  onEditMessage={handleEditMessage}
                  typingCustomers={typingCustomers}
                  selectedConversation={selectedConversation}
                  API_BASE_URL={API_BASE_URL}
                  isDeleting={isDeleting}
                  isMobile={isMobile}
                />
              </div>

              {/* Message input */}
              <div className={isMobile ? 'fixed bottom-16 left-0 right-0' : 'flex-shrink-0 border-t border-gray-200'}>
                <MessageInput
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  onSubmit={handleSubmitMessage}
                  onTyping={handleAdminTyping}
                  isSending={isSending}
                  attachment={attachment}
                  onFileChange={handleFileChange}
                  isMobile={isMobile}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquare className="h-12 w-12 mb-4 text-gray-400" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-3"></div>
            <p>Deleting...</p>
          </div>
        </div>
      )}

      {/* Edit message modal */}
      <EditMessageModal
        message={messageToEdit}
        editedContent={editedContent}
        setEditedContent={setEditedContent}
        onSave={handleSaveEdit}
        onClose={() => setMessageToEdit(null)}
      />
    </div>
  );
};

export default AdminMessage;