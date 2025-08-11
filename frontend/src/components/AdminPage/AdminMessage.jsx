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
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      setTypingTimeout(setTimeout(() => {
        socketRef.current.emit('admin-typing', {
          conversationId: selectedConversation._id,
          isTyping: false
        });
      }, 3000));
    }
  };

  // Effects
  useEffect(() => {
    const fetchData = async () => {
      try {
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
    
    socketRef.current = io(SOCKET_URL, { 
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket'] 
    });
    
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setIsSocketConnected(true);
      setupMessageHandlers();
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsSocketConnected(false);
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
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
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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