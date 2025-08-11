import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import Swal from 'sweetalert2';
import { 
  Send, 
  User, 
  Clock, 
  Search, 
  MoreVertical, 
  Paperclip, 
  Image, 
  X, 
  CircleCheck,
  Loader,
  MessageSquare,
  RefreshCw,
  SearchX,
  Trash2,
  Edit,
  ArrowLeft
} from "lucide-react";

// API URLs
const API_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
const API_URL = `${API_BASE_URL}/api/messages`;
const SOCKET_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : window.location.origin;

const AdminMessage = () => {
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
  const [showConversationScrollButton, setShowConversationScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const conversationsContainerRef = useRef(null);
  const conversationsEndRef = useRef(null);
  const [onlineCustomers, setOnlineCustomers] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const [messageToEdit, setMessageToEdit] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [typingCustomers, setTypingCustomers] = useState({});
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Define a constant for the mobile navigation height
  const MOBILE_NAV_HEIGHT = 64; // This matches the h-16 in SideNav.jsx

  // Add this effect to handle screen resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper function for sorting conversations - move this inside
  const sortConversationsByLatest = (conversationsArray) => {
    return [...conversationsArray].sort((a, b) => {
      const dateA = new Date(a.lastMessage || a.createdAt);
      const dateB = new Date(b.lastMessage || b.createdAt);
      return dateB - dateA; // Descending order (newest first)
    });
  };

  // Cleanup function for socket listeners - move this inside
  const cleanupSocketListeners = () => {
    if (socketRef.current) {
      console.log("Cleaning up socket listeners");
      socketRef.current.off('new-message');
      socketRef.current.off('customer-status-update');
      socketRef.current.off('customer-typing');
    }
  };

  // Load conversations and connect to socket
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        if (!isLoading) setIsLoading(true);
        const response = await axios.get(`${API_URL}/conversations`, {
          withCredentials: true
        });
        setConversations(response.data);
        
        // Auto-select the first conversation if available
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
    
    // Socket connection function with improved event handling
    const connectSocket = () => {
      try {
        // Get the token from localStorage
        const token = localStorage.getItem('token');
        console.log("Admin Socket connection - token available:", !!token);
        
        if (!token) {
          console.error("No auth token found - cannot establish socket connection");
          toast.error("Authentication required for messaging");
          return false;
        }
        
        // Clean up existing socket if any
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
        
        // ONLY set up connection events here, not message handlers
        socketRef.current.on('connect', () => {
          console.log("Admin socket connected with ID:", socketRef.current.id);
          setIsSocketConnected(true);
          // Explicitly announce admin connection to server
          socketRef.current.emit('admin-connected');
          toast.success("Connected to chat server");
        });
        
        socketRef.current.on('connect_error', (err) => {
          console.error("Socket connection error:", err.message);
          setIsSocketConnected(false);
          toast.error(`Connection error: ${err.message}`);
        });
        
        socketRef.current.on('disconnect', () => {
          console.log("Socket disconnected, trying to reconnect...");
          setIsSocketConnected(false);
        });
        
        return true;
      } catch (error) {
        console.error("Error in socket connection setup:", error);
        toast.error("Failed to set up chat connection");
        return false;
      }
    };
    
    // Initial fetch - only once when component mounts
    fetchConversations();
    connectSocket();
    
    // Clean up when unmounting
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Update setupMessageHandlers to include customer status tracking
  const setupMessageHandlers = () => {
    if (!socketRef.current) return;
    
    // Remove any existing listeners to prevent duplicates
    socketRef.current.off('new-message');
    socketRef.current.off('customer-status-update');
    socketRef.current.off('customer-typing');
    
    // Set up new-message handler with robust conversation comparison
    socketRef.current.on('new-message', (message) => {
      console.log("New message received by admin:", message);
      
      // CRITICAL FIX: Convert both IDs to strings to ensure proper comparison
      const messageConvId = message.conversation?._id || message.conversation;
      const selectedConvId = selectedConversation?._id;
      const messageConvString = typeof messageConvId === 'object' ? messageConvId.toString() : String(messageConvId);
      const selectedConvString = typeof selectedConvId === 'object' ? selectedConvId.toString() : String(selectedConvId);
      
      // Handle message for current conversation
      if (selectedConversation && messageConvString === selectedConvString) {
        // Play notification for customer messages only
        if (message.sender.role === 'customer') {
          try {
            const activeNotification = new Audio('/notification-subtle.mp3');
            activeNotification.volume = 0.3;
            activeNotification.play().catch(err => console.log("Audio play prevented:", err));
          } catch (error) {
            console.log("Audio error:", error);
          }
        }
        
        // Update messages without triggering loading state
        setMessages(prevMessages => {
          // Check for duplicate message
          const isDuplicate = prevMessages.some(m => 
            m._id === message._id || 
            (m._id.toString().startsWith('temp-') && 
             m.content === message.content && 
             m.sender.role === message.sender.role &&
             Math.abs(new Date(m.createdAt) - new Date(message.createdAt)) < 5000)
          );
          
          if (isDuplicate) {
            // Replace temporary messages with permanent ones
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
          
          // Add new message and scroll to it
          const updatedMessages = [...prevMessages, message];
          setTimeout(scrollToBottom, 100);
          return updatedMessages;
        });
        
        // Mark as read without triggering a new fetch
        if (message.sender.role === 'customer') {
          socketRef.current.emit('mark-read', { conversationId: selectedConvString });
        }
      }
      
      // Update conversations list with new message info
      setConversations(prev => {
        // Find the conversation that received this message
        const updatedConversations = prev.map(conv => {
          const convId = typeof conv._id === 'object' ? conv._id.toString() : String(conv._id);
          if (convId === messageConvString) {
            // Check if this is the conversation we're currently viewing
            const isCurrentlySelected = selectedConversation && selectedConvString === convId;
            
            return { 
              ...conv, 
              lastMessage: new Date(),
              lastMessageContent: message.content, // Store message preview
              lastMessageSender: message.sender.role, // Track sender type
              // Only increment unread count if not currently viewing this conversation
              unreadCount: isCurrentlySelected ? 0 : (conv.unreadCount || 0) + 1
            };
          }
          return conv;
        });
        
        // Move the conversation with new message to the top
        return sortConversationsByLatest(updatedConversations);
      });
      
      // Show notification if message is from a customer and not in current conversation
      const messageConversation = conversations.find(c => {
        const convId = typeof c._id === 'object' ? c._id.toString() : String(c._id);
        return convId === messageConvString;
      });
      
      if (message.sender.role === 'customer' && 
          (!selectedConversation || messageConvString !== selectedConvString)) {
        
        // Find the conversation to get customer name
        const customerName = messageConversation?.customer?.name || 'Customer';
        
        // Play notification sound for messages not in current view
        const notification = new Audio('/notification.mp3');
        notification.play().catch(err => console.log("Audio play prevented:", err));
        
        // Show toast notification that's clickable
        toast.custom((t) => (
          <div 
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            onClick={() => {
              // Find and select this conversation when notification is clicked
              const conv = conversations.find(c => {
                const cId = typeof c._id === 'object' ? c._id.toString() : String(c._id);
                return cId === messageConvString;
              });
              if (conv) setSelectedConversation(conv);
              toast.dismiss(t.id);
            }}
          >
            {/* Rest of your toast content */}
            <div className="flex-1 p-4 cursor-pointer">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    New message from {customerName}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 truncate">
                    {message.content}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg flex items-center justify-center p-4 text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        ), {
          duration: 5000,
          position: 'top-right'
        });
      }
    });
    
    // Set up customer-status-update handler
    socketRef.current.on('customer-status-update', (data) => {
      console.log("Customer status update received:", data);
      if (data.customers) {
        setOnlineCustomers(data.customers);
      }
    });
    
    // Set up customer typing handler
    socketRef.current.on('customer-typing', ({ customerId, conversationId, isTyping }) => {
      console.log("Customer typing:", customerId, isTyping);
      setTypingCustomers(prev => ({
        ...prev,
        [customerId]: isTyping
      }));
    });
    
    // Request online customers right away
    socketRef.current.emit('get-online-customers');
  };

  // Make sure to include the useEffect that depends on socketRef.current?.connected
  useEffect(() => {
    if (!socketRef.current || !socketRef.current.connected) {
      return;
    }
    
    // Set up all message and status handlers
    setupMessageHandlers();
    
    // Mark messages in the selected conversation as read
    if (selectedConversation) {
      socketRef.current.emit('mark-read', { 
        conversationId: selectedConversation._id 
      });
    }
    
    return () => {
      // Clean up listeners when component unmounts or socket connection changes
      if (socketRef.current) {
        socketRef.current.off('new-message');
        socketRef.current.off('customer-status-update');
        socketRef.current.off('customer-typing');
      }
    };
  }, [socketRef.current?.connected, selectedConversation?._id]); // Added selectedConversation._id dependency

  // Periodically request online customers to keep status fresh
  useEffect(() => {
    if (!socketRef.current || !socketRef.current.connected) {
      return;
    }
    
    const intervalId = setInterval(() => {
      socketRef.current.emit('get-online-customers');
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [socketRef.current?.connected]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  // Auto-scroll when new messages arrive, but only if already at bottom
  useEffect(() => {
    // Add a small delay to ensure messages are rendered
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Add this useEffect to handle scroll detection
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

  // Add this useEffect to handle scroll detection for conversations list
  useEffect(() => {
    const handleConversationScroll = () => {
      if (conversationsContainerRef.current) {
        const container = conversationsContainerRef.current;
        const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        setShowConversationScrollButton(!atBottom);
      }
    };
    
    const container = conversationsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleConversationScroll);
      return () => container.removeEventListener('scroll', handleConversationScroll);
    }
  }, []);

  // Add back the useEffect for handling conversation changes
  useEffect(() => {
    if (selectedConversation && socketRef.current && socketRef.current.connected) {
      // Mark messages as read when conversation changes
      socketRef.current.emit('mark-read', { conversationId: selectedConversation._id });
    }
  }, [selectedConversation, socketRef.current?.connected]);

  // Update the fetchMessages function (around line 455)
const fetchMessages = async (conversationId) => {
  // If we're already viewing this conversation and have messages, don't show loading
  const shouldShowLoading = !(selectedConversation?._id === conversationId && messages.length > 0);
  
  if (shouldShowLoading) {
    setIsLoadingMessages(true);
  }
  
  try {
    const response = await axios.get(`${API_URL}/${conversationId}`, {
      withCredentials: true
    });
    
    setMessages(response.data);
    
    // Mark messages as read
    if (socketRef.current) {
      socketRef.current.emit('mark-read', { conversationId });
    }
    
    // Update conversation unread count in the list
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

  // Update this function to allow browsing history
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Get the container element
      const container = messagesContainerRef.current;
      
      if (!container) return;
      
      // Check if user is already near bottom (within 300px of bottom)
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
      
      // Only auto-scroll if user is already near the bottom
      if (isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } else if (showScrollButton === false) {
        // If new message arrives and we're not showing the scroll button yet,
        // show it to indicate new messages
        setShowScrollButton(true);
      }
    }
  };

  // Add this function to scroll the conversation list to bottom
  const scrollConversationsToBottom = () => {
    conversationsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    if (!selectedConversation) {
      toast.error("No conversation selected");
      return;
    }
    
    try {
      setIsSending(true);
      
      // Upload attachment if any
      let attachmentPath = null;
      if (attachment) {
        attachmentPath = await uploadAttachment();
      }
      
      // Create temp message for immediate display
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
      
      // Update local state immediately
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      
      // Send message via socket
      socketRef.current.emit('send-message', {
        conversationId: selectedConversation._id,
        content: newMessage,
        attachment: attachmentPath
      });
      
      // Clear form
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

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv => 
    conv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to check if a customer is online
  const isCustomerOnline = (customerId) => {
    return onlineCustomers.includes(customerId);
  };

  // Function to handle deleting a message with sweet alert
  const handleDeleteMessage = async (messageId, e) => {
    e.stopPropagation();
    
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Delete Message?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });
    
    // If user confirms deletion
    if (result.isConfirmed) {
      try {
        setIsDeleting(true);
        
        // Check if it's a temporary message (client-side only)
        if (messageId.toString().startsWith('temp-')) {
          // Just remove it from local state without server call
          setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
          
          Swal.fire({
            title: 'Deleted!',
            text: 'Message has been deleted',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
          
          return;
        }
        
        // For real messages, proceed with API call
        const response = await axios.delete(`${API_URL}/${messageId}`, {
          withCredentials: true
        });
        
        if (response.status === 200) {
          // Remove the deleted message from state
          setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
          Swal.fire({
            title: 'Deleted!',
            text: 'Message has been deleted',
            icon: 'success',
            timer: 0,
            showConfirmButton: false
          });
        } else {
          throw new Error('Failed to delete');
        }
      } catch (error) {
        console.error("Error deleting message:", error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete message',
          icon: 'error'
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  // Function to handle deleting a conversation with sweet alert
  const handleDeleteConversation = async (conversationId, e) => {
    e.stopPropagation();
    
    // Find conversation details
    const conversation = conversations.find(c => c._id === conversationId);
    const customerName = conversation?.customer?.name || 'this customer';
    
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Delete Entire Conversation?',
      text: `All messages with ${customerName} will be permanently deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });
    
    // If user confirms deletion
    if (result.isConfirmed) {
      setIsDeleting(true);
      
      try {
        const response = await axios.delete(`${API_URL}/conversation/${conversationId}`, {
          withCredentials: true
        });
        
        if (response.status === 200) {
          // Remove the conversation from state
          setConversations(prev => prev.filter(conv => conv._id !== conversationId));
          
          // If the deleted conversation was selected, clear selection
          if (selectedConversation && selectedConversation._id === conversationId) {
            setSelectedConversation(null);
            setMessages([]);
          }
          
          Swal.fire({
            title: 'Deleted!',
            text: 'Conversation has been deleted',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          throw new Error('Failed to delete');
        }
      } catch (error) {
        console.error("Error deleting conversation:", error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete conversation',
          icon: 'error'
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleAdminTyping = () => {
    if (socketRef.current && socketRef.current.connected && selectedConversation) {
      socketRef.current.emit('admin-typing', {
        conversationId: selectedConversation._id,
        isTyping: true
      });
      
      // Clear existing timeout
      if (typingTimeout) clearTimeout(typingTimeout);
      
      // Set new timeout to stop typing indicator after 2 seconds of inactivity
      const timeout = setTimeout(() => {
        socketRef.current.emit('admin-typing', {
          conversationId: selectedConversation._id,
          isTyping: false
        });
      }, 2000);
      
      setTypingTimeout(timeout);
    }
  };

  // Add this useEffect to keep conversations sorted by most recent messages

useEffect(() => {
  // Sort conversations by lastMessage date (most recent first)
  const sortedConversations = [...conversations].sort((a, b) => {
    const dateA = new Date(a.lastMessage || a.createdAt);
    const dateB = new Date(b.lastMessage || b.createdAt);
    return dateB - dateA;
  });
  
  // Only update if order has changed
  if (JSON.stringify(sortedConversations.map(c => c._id)) !== 
      JSON.stringify(conversations.map(c => c._id))) {
    setConversations(sortedConversations);
  }
}, [conversations]);

  return (
    <div className={`h-screen bg-gray-50 ${isMobile ? 'pb-16' : 'p-4'}`}>
      {/* Mobile-specific header - Only show when conversation is selected */}
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
        // Desktop & Mobile conversation list header
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

      {/* Main chat container */}
      <div className={`${isMobile ? 'h-[calc(100vh-4rem)]' : 'h-full'} bg-white shadow-sm flex`}>
        {/* Conversation list - Hide on mobile when conversation selected */}
        <div className={`${
          isMobile && selectedConversation ? 'hidden' : 'w-full'
        } md:w-80 border-r border-gray-200 flex flex-col`}>
          {/* Search bar */}
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
            className="flex-1 overflow-y-auto"
            style={{ 
              height: isMobile ? "calc(100vh - 8rem)" : "calc(100vh - 12rem)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch"
            }}
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
              // Conversation items
              filteredConversations.map((conv) => (
                <div
                  key={conv._id}
                  className={`p-3 border-b border-gray-100 cursor-pointer transition-colors relative group
                    ${selectedConversation?._id === conv._id 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                      : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                    }
                    ${conv.unreadCount > 0 ? 'bg-amber-50' : ''}
                  `}
                >
                  {/* Make the entire div clickable except for delete button */}
                  <div 
                    className="flex items-center space-x-3"
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                        {conv.customer?.name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      {isCustomerOnline(conv.customer?._id) && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{conv.customer?.name || 'Customer'}</p>
                        <span className="text-xs text-gray-500">{formatTime(conv.lastMessage || conv.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conv.lastMessageContent || 'No messages yet'}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="flex-shrink-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-medium">{conv.unreadCount}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile-friendly delete button */}
                  <button
                    className={`absolute ${isMobile ? 'right-3 top-1/2 -translate-y-1/2' : 'top-2 right-2'} 
                      ${isMobile ? 'p-2 bg-red-100' : 'p-1.5 bg-red-50 opacity-0 group-hover:opacity-100'}
                      rounded-full text-red-500 hover:bg-red-100 transition-all`}
                    onClick={(e) => handleDeleteConversation(conv._id, e)}
                    aria-label="Delete conversation"
                  >
                    <Trash2 size={isMobile ? 18 : 14} />
                  </button>
                </div>
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
                style={{ 
                  height: isMobile ? "calc(100vh - 8rem)" : "calc(100vh - 12rem)",
                  paddingBottom: isMobile ? "5rem" : "1rem"
                }}
              >
                {isLoadingMessages ? (
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
                          const isAdmin = group[0].sender.role === 'admin';
                          
                          return (
                            <div 
                              key={groupIndex} 
                              className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-4`}
                            >
                              {!isAdmin && (
                                <div className="h-8 w-8 rounded-full bg-gray-300 flex-shrink-0 mr-2 mt-1 flex items-center justify-center">
                                  <User size={16} className="text-gray-600" />
                                </div>
                              )}
                              
                              <div className="max-w-[75%]">
                                <div className={`text-xs mb-1 ${isAdmin ? 'text-right' : ''}`}>
                                  <span className="font-semibold">
                                    {isAdmin ? 'You' : group[0].sender.name || 'Customer'}
                                  </span>
                                </div>
                                
                                <div className="space-y-1">
                                  {group.map((message) => (
                                    <div
                                      key={message._id}
                                      className={`rounded-lg px-4 py-2 relative group ${
                                        isAdmin 
                                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none shadow-md' 
                                          : 'bg-white text-gray-800 rounded-tl-none border border-gray-200 shadow-sm'
                                      }`}
                                    >
                                      {message.attachment && (
                                        <div className="mb-2">
                                          <img 
                                            src={message.attachment.startsWith('data:') 
                                              ? message.attachment 
                                              : `${API_BASE_URL}${message.attachment}`
                                            } 
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
                                      <p className="whitespace-pre-wrap">{message.content}</p>
                                      <div className="flex items-center justify-end text-xs mt-1 opacity-80">
                                        <span>{formatTime(message.timestamp || message.createdAt)}</span>
                                        {isAdmin && (
                                          <CircleCheck 
                                            size={14} 
                                            className={`ml-1 ${message.isRead ? 'text-green-200' : 'text-blue-300'}`}
                                          />
                                        )}
                                      </div>
                                      
                                      {/* Replace your current delete button with this menu button */}
                                      <button
                                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-gray-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMessageMenu(activeMessageMenu === message._id ? null : message._id);
                                        }}
                                        disabled={isDeleting}
                                        title="Message options"
                                      >
                                        <MoreVertical size={14} />
                                      </button>

                                      {/* Message options menu */}
                                      {activeMessageMenu === message._id && (
                                        <div className="absolute top-8 right-2 bg-white shadow-lg rounded-md py-1 w-32 z-10">
                                          {isAdmin && message.content && ( // Only show edit for text messages
                                            <button
                                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setMessageToEdit(message);
                                                setEditedContent(message.content);
                                                setActiveMessageMenu(null);
                                              }}
                                            >
                                              <Edit size={14} className="mr-2" />
                                              Edit message
                                            </button>
                                          )}
                                          <button
                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                                            onClick={(e) => {
                                              handleDeleteMessage(message._id, e);
                                              setActiveMessageMenu(null);
                                            }}
                                          >
                                            <Trash2 size={14} className="mr-2" />
                                            Delete message
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {isAdmin && (
                                <div className="h-8 w-8 rounded-full bg-blue-500 flex-shrink-0 ml-2 mt-1 flex items-center justify-center">
                                  <User size={16} className="text-white" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    {selectedConversation && typingCustomers[selectedConversation.customer?._id] && (
                      <div className="flex items-center mt-2">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex-shrink-0 mr-2 flex items-center justify-center">
                          <User size={16} className="text-gray-600" />
                        </div>
                        <div className="bg-white rounded-lg px-4 py-2 text-gray-500 inline-block border border-gray-200">
                          <div className="flex items-center">
                            <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce mr-1" style={{ animationDelay: "0ms" }}></span>
                            <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce mr-1" style={{ animationDelay: "300ms" }}></span>
                            <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message input */}
              <div className={`bg-white border-t border-gray-200 p-3 ${
                isMobile ? 'fixed bottom-16 left-0 right-0' : 'sticky bottom-0'
              }`}>
                <form onSubmit={handleSubmit} className="flex items-center space-x-2 max-w-4xl mx-auto">
                  <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleAdminTyping();
                      }}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent outline-none text-sm"
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current.click()}
                      className="text-gray-400 hover:text-blue-500 p-1"
                    >
                      <Image size={18} />
                    </button>
                  </div>
                  <button 
                    type="submit" 
                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
                    disabled={isSending || (!newMessage.trim() && !attachment)}
                  >
                    {isSending ? (
                      <Loader className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </form>
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

      {/* Show loading overlay during delete operations */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-3"></div>
            <p>Deleting...</p>
          </div>
        </div>
      )}

      {/* Edit Message Modal */}
      {messageToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Edit Message</h3>
              <button 
                onClick={() => setMessageToEdit(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 min-h-[100px] mb-4"
              placeholder="Edit your message..."
            />
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setMessageToEdit(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Implement your handleEditMessage function here
                  // For now, just update the local state
                  setMessages(prevMessages => 
                    prevMessages.map(msg => 
                      msg._id === messageToEdit._id 
                        ? {...msg, content: editedContent} 
                        : msg
                    )
                  );
                  setMessageToEdit(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!editedContent.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessage;