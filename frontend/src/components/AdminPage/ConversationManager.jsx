import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import Swal from 'sweetalert2';

// Custom hooks for message management
const useMessageHandlers = (socketRef, selectedConversation, setMessages, setConversations, setOnlineCustomers, setTypingCustomers, scrollToBottom, sortConversationsByLatest) => {
  useEffect(() => {
    const setupMessageHandlers = () => {
      if (!socketRef.current) return;
      
      // Clear existing listeners
      socketRef.current.off('new-message');
      socketRef.current.off('customer-status-update');
      socketRef.current.off('customer-typing');
      
      socketRef.current.on('new-message', (message) => {
        console.log("Admin received new message:", message);
        
        const messageConvId = message.conversation?._id || message.conversation;
        const selectedConvId = selectedConversation?._id;
        
        // Simple string comparison
        const messageConvString = String(messageConvId);
        const selectedConvString = String(selectedConvId);
        
        // If this message is for the currently selected conversation
        if (selectedConversation && messageConvString === selectedConvString) {
          setMessages(prevMessages => {
            // Simple duplicate check - only check if message ID already exists
            const messageExists = prevMessages.some(m => m._id === message._id);
            
            if (messageExists) {
              console.log("Message already exists, skipping");
              return prevMessages;
            }
            
            console.log("Adding new message to admin view");
            const updatedMessages = [...prevMessages, message];
            
            // Auto-scroll for new messages
            setTimeout(() => {
              scrollToBottom();
            }, 100);
            
            return updatedMessages;
          });
          
          // Mark customer messages as read immediately
          if (message.sender.role === 'customer') {
            socketRef.current.emit('mark-read', { conversationId: selectedConvString });
          }
        }
        
        // Update conversations list
        setConversations(prev => {
          const updatedConversations = prev.map(conv => {
            const convId = String(conv._id);
            if (convId === messageConvString) {
              const isCurrentlySelected = selectedConversation && selectedConvString === convId;
              
              return { 
                ...conv, 
                lastMessage: new Date(),
                lastMessageContent: message.content || "Image",
                lastMessageSender: message.sender.role,
                // Only increment unread count if not currently viewing this conversation
                unreadCount: isCurrentlySelected ? 0 : (conv.unreadCount || 0) + (message.sender.role === 'customer' ? 1 : 0)
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
      
      // Request online customers list
      socketRef.current.emit('get-online-customers');
    };

    setupMessageHandlers();
  }, [socketRef, selectedConversation, setMessages, setConversations, setOnlineCustomers, setTypingCustomers, scrollToBottom, sortConversationsByLatest]);
};

// Custom hook for socket connection
const useSocketConnection = (SOCKET_URL, setIsSocketConnected) => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { 
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket'] 
    });
    
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setIsSocketConnected(true);
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
  }, [SOCKET_URL, setIsSocketConnected]);

  return socketRef;
};

// Custom hook for conversation management
const useConversationData = (API_URL, setIsLoading) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const sortConversationsByLatest = (conversationsArray) => {
    return [...conversationsArray].sort((a, b) => {
      const dateA = new Date(a.lastMessage || a.createdAt);
      const dateB = new Date(b.lastMessage || b.createdAt);
      return dateB - dateA;
    });
  };

  const fetchConversations = async () => {
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
      try {
        const response = await axios.delete(`${API_URL}/conversation/${conversationId}`, {
          withCredentials: true
        });
        
        if (response.status === 200) {
          setConversations(prev => prev.filter(conv => conv._id !== conversationId));
          
          if (selectedConversation && selectedConversation._id === conversationId) {
            setSelectedConversation(null);
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
      }
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return {
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    handleDeleteConversation,
    sortConversationsByLatest
  };
};

// Custom hook for message management
const useMessageManager = (API_URL, selectedConversation, socketRef) => {
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageToEdit, setMessageToEdit] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleSubmitMessage = async (e, newMessage, attachment, setNewMessage, setAttachment, setAttachmentPreview, setIsSending) => {
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
      
      // Create a more unique temp ID
      const tempId = `temp-admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const tempMessage = {
        _id: tempId,
        sender: {
          id: 'admin',
          name: 'You',
          role: 'admin' 
        },
        content: newMessage,
        attachment: attachmentPath,
        conversation: selectedConversation._id,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        isRead: true,
        isTemp: true // Mark as temporary
      };
      
      // Add temp message immediately for instant feedback
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      
      // Send via socket
      socketRef.current.emit('send-message', {
        conversationId: selectedConversation._id,
        content: newMessage,
        attachment: attachmentPath,
        tempId: tempId // Send temp ID to replace later
      });
      
      // Clear inputs
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

  useEffect(() => {
    fetchMessages();
  }, [selectedConversation]);

  return {
    messages,
    setMessages,
    isLoadingMessages,
    messageToEdit,
    setMessageToEdit,
    editedContent,
    setEditedContent,
    isDeleting,
    handleDeleteMessage,
    handleEditMessage,
    handleSaveEdit,
    handleSubmitMessage
  };
};

// API URLs
const API_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
const API_URL = `${API_BASE_URL}/api/messages`;
const SOCKET_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : window.location.origin;

// Main ConversationManager hook
const useConversationManager = () => {

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [onlineCustomers, setOnlineCustomers] = useState([]);
  const [typingCustomers, setTypingCustomers] = useState({});
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const conversationsContainerRef = useRef(null);

  // Custom hooks
  const socketRef = useSocketConnection(SOCKET_URL, setIsSocketConnected);
  
  const {
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    handleDeleteConversation,
    sortConversationsByLatest
  } = useConversationData(API_URL, setIsLoading);

  const {
    messages,
    setMessages,
    isLoadingMessages,
    messageToEdit,
    setMessageToEdit,
    editedContent,
    setEditedContent,
    isDeleting,
    handleDeleteMessage,
    handleEditMessage,
    handleSaveEdit,
    handleSubmitMessage
  } = useMessageManager(API_URL, selectedConversation, socketRef);

  // Helper functions
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

  // Setup message handlers
  useMessageHandlers(socketRef, selectedConversation, setMessages, setConversations, setOnlineCustomers, setTypingCustomers, scrollToBottom, sortConversationsByLatest);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return {
    // State
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    setMessages,
    isLoading,
    isLoadingMessages,
    isSocketConnected,
    onlineCustomers,
    typingCustomers,
    isMobile,
    isDeleting,
    messageToEdit,
    setMessageToEdit,
    editedContent,
    setEditedContent,
    
    // Refs
    messagesEndRef,
    messagesContainerRef,
    conversationsContainerRef,
    
    // Functions
    formatTime,
    formatDate,
    isCustomerOnline,
    scrollToBottom,
    handleDeleteConversation,
    handleDeleteMessage,
    handleEditMessage,
    handleSaveEdit,
    handleSubmitMessage,
    handleAdminTyping,
    
    // Constants
    API_BASE_URL,
    API_URL,
    SOCKET_URL
  };
};

export default useConversationManager;
