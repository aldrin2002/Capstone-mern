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
  const socketRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const conversationsContainerRef = useRef(null);

  // Additional state
  const [onlineCustomers, setOnlineCustomers] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [messageToEdit, setMessageToEdit] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [typingCustomers, setTypingCustomers] = useState({});
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Helper functions (keeping existing logic)
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

  // All existing functions (setupMessageHandlers, scrollToBottom, event handlers, etc.)
  // ... keeping all the existing logic but I'll show the key ones

  const setupMessageHandlers = () => {
    if (!socketRef.current) return;
    
    socketRef.current.off('new-message');
    socketRef.current.off('customer-status-update');
    socketRef.current.off('customer-typing');
    
    socketRef.current.on('new-message', (message) => {
      const messageConvId = message.conversation?._id || message.conversation;
      const selectedConvId = selectedConversation?._id;
      const messageConvString = typeof messageConvId === 'object' ? messageConvId.toString() : String(messageConvId);
      const selectedConvString = typeof selectedConvId === 'object' ? selectedConvId.toString() : String(selectedConvId);
      
      if (selectedConversation && messageConvString === selectedConvString) {
        if (message.sender.role === 'customer') {
          try {
            const activeNotification = new Audio('/notification-subtle.mp3');
            activeNotification.volume = 0.3;
            activeNotification.play().catch(err => console.log("Audio play prevented:", err));
          } catch (error) {
            console.log("Audio error:", error);
          }
        }
        
        setMessages(prevMessages => {
          const isDuplicate = prevMessages.some(m => 
            m._id === message._id || 
            (m._id.toString().startsWith('temp-') && 
             m.content === message.content && 
             m.sender.role === message.sender.role &&
             Math.abs(new Date(m.createdAt) - new Date(message.createdAt)) < 5000)
          );
          
          if (isDuplicate) {
            return prevMessages.map(m => {
              if (m._id.toString().startsWith('temp-') && 
                  m.content === message.content && 
                  m.sender.role === message.sender.role &&
                  Math.abs(new Date(m.createdAt) - new Date(message.createdAt)) < 5000) {
                return message;
              }
              return m;
            });
          }
          
          const updatedMessages = [...prevMessages, message];
          setTimeout(scrollToBottom, 100);
          return updatedMessages;
        });
        
        if (message.sender.role === 'customer') {
          socketRef.current.emit('mark-read', { conversationId: selectedConvString });
        }
      }
      
      setConversations(prev => {
        const updatedConversations = prev.map(conv => {
          const convId = typeof conv._id === 'object' ? conv._id.toString() : String(conv._id);
          if (convId === messageConvString) {
            const isCurrentlySelected = selectedConversation && selectedConvString === convId;
            
            return { 
              ...conv, 
              lastMessage: new Date(),
              lastMessageContent: message.content,
              lastMessageSender: message.sender.role,
              unreadCount: isCurrentlySelected ? 0 : (conv.unreadCount || 0) + 1
            };
          }
          return conv;
        });
        
        return sortConversationsByLatest(updatedConversations);
      });
    });
    
    socketRef.current.on('customer-status-update', (data) => {
      if (data.customers) {
        setOnlineCustomers(data.customers);
      }
    });
    
    socketRef.current.on('customer-typing', ({ customerId, conversationId, isTyping }) => {
      setTypingCustomers(prev => ({
        ...prev,
        [customerId]: isTyping
      }));
    });
    
    socketRef.current.emit('get-online-customers');
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesContainerRef.current;
      if (!container) return;
      
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
      
      if (isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } else if (showScrollButton === false) {
        setShowScrollButton(true);
      }
    }
  };

  // Event handlers (keeping existing logic)
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

  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !attachment) return;
    if (!selectedConversation) {
      toast.error("No conversation selected");
      return;
    }
    
    try {
      setIsSending(true);
      
      let attachmentPath = null;
      if (attachment) {
        const formData = new FormData();
        formData.append('attachment', attachment);
        
        const response = await axios.post(`${API_URL}/attachment`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        });
        
        attachmentPath = response.data.filePath;
      }
      
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        sender: {
          id: 'admin',
          name: 'You',
          role: 'admin' 
        },
        content: newMessage,
        attachment: attachmentPath,
        conversation: selectedConversation._id,
        createdAt: new Date(),
        isRead: true
      };
      
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      
      socketRef.current.emit('send-message', {
        conversationId: selectedConversation._id,
        content: newMessage,
        attachment: attachmentPath
      });
      
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

  const handleAdminTyping = () => {
    if (socketRef.current && socketRef.current.connected && selectedConversation) {
      socketRef.current.emit('admin-typing', {
        conversationId: selectedConversation._id,
        isTyping: true
      });
      
      if (typingTimeout) clearTimeout(typingTimeout);
      
      const timeout = setTimeout(() => {
        socketRef.current.emit('admin-typing', {
          conversationId: selectedConversation._id,
          isTyping: false
        });
      }, 2000);
      
      setTypingTimeout(timeout);
    }
  };

  const fetchMessages = async (conversationId) => {
    const shouldShowLoading = !(selectedConversation?._id === conversationId && messages.length > 0);
    
    if (shouldShowLoading) {
      setIsLoadingMessages(true);
    }
    
    try {
      const response = await axios.get(`${API_URL}/${conversationId}`, {
        withCredentials: true
      });
      
      setMessages(response.data);
      
      if (socketRef.current) {
        socketRef.current.emit('mark-read', { conversationId });
      }
      
      setConversations(prev => 
        prev.map(conv => 
          conv._id === conversationId 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
      
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      if (shouldShowLoading) {
        setIsLoadingMessages(false);
      }
    }
  };

  // All existing useEffects (keeping the same logic)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        if (!isLoading) setIsLoading(true);
        const response = await axios.get(`${API_URL}/conversations`, {
          withCredentials: true
        });
        setConversations(response.data);
        
        if (response.data.length > 0 && !selectedConversation) {
          setSelectedConversation(response.data[0]);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        toast.error("Failed to load conversations");
      } finally {
        setIsLoading(false);
      }
    };
    
    const connectSocket = () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error("No auth token found - cannot establish socket connection");
          toast.error("Authentication required for messaging");
          return false;
        }
        
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
        
        socketRef.current = io(SOCKET_URL, {
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000
        });
        
        socketRef.current.on('connect', () => {
          setIsSocketConnected(true);
          socketRef.current.emit('admin-connected');
          toast.success("Connected to chat server");
        });
        
        socketRef.current.on('connect_error', (err) => {
          setIsSocketConnected(false);
          toast.error(`Connection error: ${err.message}`);
        });
        
        socketRef.current.on('disconnect', () => {
          setIsSocketConnected(false);
        });
        
        return true;
      } catch (error) {
        console.error("Error in socket connection setup:", error);
        toast.error("Failed to set up chat connection");
        return false;
      }
    };
    
    fetchConversations();
    connectSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current || !socketRef.current.connected) {
      return;
    }
    
    setupMessageHandlers();
    
    if (selectedConversation) {
      socketRef.current.emit('mark-read', { 
        conversationId: selectedConversation._id 
      });
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off('new-message');
        socketRef.current.off('customer-status-update');
        socketRef.current.off('customer-typing');
      }
    };
  }, [socketRef.current?.connected, selectedConversation?._id]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => 
    conv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 ${isMobile ? 'pb-16' : 'p-4'} relative overflow-hidden`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Mobile header */}
      {isMobile && selectedConversation ? (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-white/20 shadow-xl">
          <div className="flex items-center h-16 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700">
            <button 
              onClick={() => setSelectedConversation(null)}
              className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-all duration-300 transform hover:scale-110"
            >
              <ArrowLeft size={20} className="text-white drop-shadow-lg" />
            </button>
            <div className="ml-3 flex-1">
              <h2 className="font-bold text-white truncate drop-shadow-lg">
                {selectedConversation.customer?.name || 'Customer'}
              </h2>
              <p className="text-xs text-blue-100 truncate">
                {selectedConversation.customer?.email}
              </p>
            </div>
            {isCustomerOnline(selectedConversation.customer?._id) && (
              <span className="text-xs text-green-200 flex items-center font-semibold bg-green-500/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <span className="h-2 w-2 bg-green-300 rounded-full mr-2 animate-pulse shadow-lg"></span>
                Active
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-xl border-b border-white/20 rounded-t-3xl shadow-2xl relative overflow-hidden">
          {/* Header background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5"></div>
          
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center relative z-10">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mr-4 shadow-xl transform hover:scale-110 transition-all duration-300">
              <MessageSquare className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
            Messages
            {isSocketConnected && (
              <span className="ml-4 flex items-center text-sm font-semibold text-green-600 bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full shadow-lg animate-pulse">
                <Zap className="h-4 w-4 mr-2 text-green-500" />
                <span className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-ping"></span>
                Live Chat Active
              </span>
            )}
          </h2>
        </div>
      )}

      {/* Main container */}
      <div className={`${isMobile ? 'h-[calc(100vh-4rem)]' : 'h-full'} bg-white/60 backdrop-blur-xl shadow-2xl rounded-3xl flex overflow-hidden border border-white/20 relative z-10`}>
        {/* Conversations sidebar */}
        <div className={`${
          isMobile && selectedConversation ? 'hidden' : 'w-full'
        } md:w-80 border-r border-white/30 flex flex-col bg-gradient-to-b from-white/80 to-gray-50/80 backdrop-blur-xl`}>
          
          {/* Search */}
          <div className="p-4 border-b border-white/30 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" size={18} />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-12 pr-4 py-3 text-sm bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          {/* Conversations list */}
          <div 
            ref={conversationsContainerRef}
            className="flex-1 overflow-y-auto custom-scrollbar"
            style={{ 
              height: isMobile ? "calc(100vh - 8rem)" : "calc(100vh - 12rem)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch"
            }}
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Loader className="h-8 w-8 text-blue-500 animate-spin" />
                    <div className="absolute inset-0 h-8 w-8 border-4 border-purple-500/30 rounded-full animate-ping"></div>
                  </div>
                  <p className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Loading conversations...
                  </p>
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500 p-6">
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4 shadow-lg">
                  <SearchX size={32} className="text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-600 mb-2">No conversations found</p>
                <p className="text-sm text-gray-400 text-center">Try adjusting your search or start a new conversation</p>
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {filteredConversations.map((conv, index) => (
                  <div
                    key={conv._id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <ConversationItem
                      conversation={conv}
                      isSelected={selectedConversation?._id === conv._id}
                      isOnline={isCustomerOnline(conv.customer?._id)}
                      onSelect={setSelectedConversation}
                      onDelete={handleDeleteConversation}
                      formatTime={formatTime}
                      isMobile={isMobile}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className={`${
          isMobile && !selectedConversation ? 'hidden' : 'w-full'
        } md:flex-1 flex flex-col bg-gradient-to-b from-gray-50/50 to-white/50 backdrop-blur-xl relative overflow-hidden`}>
          
          {/* Messages area background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.3) 2px, transparent 0)`,
              backgroundSize: '50px 50px'
            }}></div>
          </div>

          {selectedConversation ? (
            <>
              {/* Messages container */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar relative z-10"
                style={{ 
                  height: isMobile ? "calc(100vh - 8rem)" : "calc(100vh - 12rem)",
                  paddingBottom: isMobile ? "6rem" : "2rem"
                }}
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
              <div className="relative z-10">
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
            <div className="flex flex-col items-center justify-center h-full text-gray-500 relative z-10">
              <div className="p-8 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-full mb-6 shadow-2xl backdrop-blur-sm transform hover:scale-110 transition-all duration-500">
                <MessageSquare className="h-16 w-16 text-blue-400 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-blue-600 bg-clip-text text-transparent mb-3">
                Select a conversation
              </h3>
              <p className="text-gray-400 text-center max-w-md">
                Choose a conversation from the sidebar to start messaging with your customers
              </p>
              <div className="mt-6 flex items-center space-x-2 text-blue-400">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <span className="text-sm font-medium">Real-time messaging</span>
                <Sparkles className="h-5 w-5 animate-pulse delay-1000" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced loading overlay */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl flex items-center space-x-4 border border-white/20">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-200 border-t-red-600"></div>
              <div className="absolute inset-0 rounded-full h-8 w-8 border-4 border-purple-500/30 animate-ping"></div>
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">Deleting...</p>
              <p className="text-gray-500 text-sm">Please wait a moment</p>
            </div>
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

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(59, 130, 246, 0.3) transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(147, 51, 234, 0.4));
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(147, 51, 234, 0.6));
        }
      `}</style>
    </div>
  );
};

export default AdminMessage;