import { useState, useEffect, useRef, useCallback } from "react";
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
import { useMessageNotifications } from "../../context/MessageNotificationContext";
import { audioService } from "../../utils/audioService";

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
  const { socket, isConnected, resetUnreadCount, setMessagesPageActive } = useMessageNotifications();
  
  // State management (remove socket and isConnected since they come from context)
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
  
  // Keep this ref
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

  const handleMessageUpdated = (updatedMessage) => {
    console.log("Message updated:", updatedMessage);
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg._id === updatedMessage._id ? updatedMessage : msg
      )
    );
  };

  const handleMessageDeleted = (messageId) => {
    console.log("Message deleted:", messageId);
    setMessages(prevMessages => 
      prevMessages.filter(msg => msg._id !== messageId)
    );
  };

  // COPIED FROM CUSTOMER MESSAGE - Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // REPLACE with this useEffect that uses the context socket
  useEffect(() => {
    // Reset unread count when component mounts
    resetUnreadCount();
    
    // Set up socket event listeners using socket from context
    if (socket) {
      console.log("Using socket from context:", socket.id);

      // FIXED: Listen for the correct event name
      socket.on("customer-status-update", (data) => {
        console.log("🟢 Customer status update received:", data);
        setOnlineCustomers(data.customers || []);
      });

      // Also listen for the alternative event name (if backend sends both)
      socket.on("online-customers", (onlineCustomerIds) => {
        console.log("🟢 Online customers update received:", onlineCustomerIds);
        setOnlineCustomers(onlineCustomerIds || []);
      });

      // Listen for typing indicators
      socket.on("customer-typing", ({ conversationId, customerId, isTyping }) => {
        console.log("⌨️ Customer typing update:", { conversationId, customerId, isTyping });
        setTypingCustomers((prev) => ({
          ...prev,
          [customerId]: isTyping,
        }));
      });

      // Listen for message updates and deletions
      socket.on("message-updated", handleMessageUpdated);
      socket.on("message-deleted", handleMessageDeleted);

      // Clean up listeners when component unmounts
      return () => {
        socket.off("customer-status-update");
        socket.off("online-customers");
        socket.off("customer-typing");
        socket.off("message-updated");
        socket.off("message-deleted");
      };
    }
  }, [socket, resetUnreadCount]); // Add resetUnreadCount to dependencies

  // ADD: Separate useEffect for message handling that has access to current selectedConversation
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (message) => {
      console.log("Admin received new message:", message);
      
      // Check if message belongs to current conversation
      const messageConvId = (message.conversation?._id || message.conversation).toString();
      const currentConvId = selectedConversation?._id?.toString();
      
      // Add message if it's for current conversation
      if (currentConvId && messageConvId === currentConvId) {
        setMessages(prevMessages => {
          // Check for duplicates
          const isDuplicate = prevMessages.some(m => 
            m._id === message._id || 
            (m.content === message.content && 
             m.sender.id === message.sender.id && 
             Math.abs(new Date(m.createdAt) - new Date(message.createdAt)) < 1000)
          );
          
          return isDuplicate ? prevMessages : [...prevMessages, message];
        });
      }
      
      // Always update conversations list
      setConversations(prev => {
        const conversationExists = prev.some(c => c._id.toString() === messageConvId);
        
        if (!conversationExists) {
          return sortConversationsByLatest([...prev]);
        }
        
        const updatedConversations = prev.map(conv => {
          if (conv._id.toString() === messageConvId) {
            return {
              ...conv,
              lastMessage: new Date(),
              lastMessageContent: message.content || 'Image',
              lastMessageSender: message.sender.role,
              unreadCount: message.sender.role === 'customer' ? (conv.unreadCount || 0) + 1 : 0
            };
          }
          return conv;
        });
        
        return sortConversationsByLatest(updatedConversations);
      });
    };
    
    // Add event listener
    socket.on("new-message", handleNewMessage);
    
    // Cleanup
    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, [socket, selectedConversation]); // Re-run when selectedConversation changes

  // ADD: Join conversation room when selecting new conversation
  useEffect(() => {
    if (socket && isConnected && selectedConversation) {
      console.log(`🚪 Admin joining room for conversation: ${selectedConversation._id}`);
      socket.emit('join-conversation', selectedConversation._id);
    }
  }, [socket, isConnected, selectedConversation]);

  // KEEP: Join all conversation rooms when socket connects
  useEffect(() => {
    if (socket && isConnected && conversations.length > 0) {
      console.log("🚪 Admin joining ALL conversation rooms");
      conversations.forEach(conv => {
        socket.emit('join-conversation', conv._id);
        console.log(`Admin joined room: ${conv._id}`);
      });
    }
  }, [socket, isConnected, conversations]);

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
      setIsSending(true); // Add this line to show sending state
      let attachmentPath = null;
      
      // Upload attachment if exists
      if (attachment) {
        const formData = new FormData();
        formData.append("image", attachment); // Change "attachment" to "image"
        
        // Use the orders upload endpoint which is already working with Cloudinary
        const uploadUrl = import.meta.env.MODE === "development" 
          ? "http://localhost:5000/api/orders/upload" 
          : "/api/orders/upload";
          
        try {
          const uploadRes = await axios.post(
            uploadUrl,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
              withCredentials: true
            }
          );
          
          console.log("Upload response:", uploadRes.data);
          
          // Extract the Cloudinary URL from the response
          if (uploadRes.data.imagePath) {
            attachmentPath = uploadRes.data.imagePath; // This is the Cloudinary URL
          } else {
            throw new Error("Failed to get image URL from response");
          }
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError);
          toast.error("Failed to upload image. Please try again.");
          setIsSending(false);
          return;
        }
      }
      
      // Emit message via socket
      // Use a non-empty content string for image-only messages
      const messageContent = newMessage.trim() || (attachmentPath ? " " : "");
      
      socket.emit("send-message", {
        conversationId: selectedConversation._id,
        content: messageContent,  // Use messageContent instead of newMessage
        attachment: attachmentPath
      });
      
      // Play sent sound when message is sent successfully
      if (audioService) {
        audioService.playSentSound();
        console.log("🔊 Played sent sound for message");
      }
      
      // Clear inputs
      setNewMessage("");
      setAttachment(null);
      setAttachmentPreview(null);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false); // Add this line to reset sending state
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("File size exceeds 2MB limit.");
        return;
      }
      
      setAttachment(file);
      
      // Preview image if it's an image file
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachmentPreview(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  // SEARCH FUNCTIONALITY
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (conversationsContainerRef.current) {
      const conversations = Array.from(conversationsContainerRef.current.children);
      conversations.forEach(conv => {
        const text = conv.innerText.toLowerCase();
        const isVisible = text.includes(value.toLowerCase());
        conv.style.display = isVisible ? 'block' : 'none';
      });
    }
  };

  // LOAD MORE MESSAGES
  const handleLoadMore = async () => {
    if (!selectedConversation || isLoadingMessages) return;
    
    setIsLoadingMessages(true);
    
    try {
      const response = await axios.get(`${API_URL}/${selectedConversation._id}?page=${messages.length / 20 + 1}`, {
        withCredentials: true
      });
      
      setMessages(prev => [...prev, ...(response.data || [])]);
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Replace the entire return statement with this mobile-responsive version:
  return (
    <div className="flex h-screen bg-white">
      {/* Mobile: Show sidebar OR messages, not both */}
      {isMobile ? (
        <>
          {!selectedConversation ? (
            /* Mobile Sidebar - Conversations list */
            <div className="w-full h-full flex flex-col bg-gray-50">
              {/* Mobile Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <h1 className="text-lg font-semibold">Messages</h1>
                <p className="text-blue-100 text-sm">Manage customer conversations</p>
              </div>

              {/* Search bar */}
              <div className="p-4 border-b bg-white">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>
              
              {/* Conversations list */}
              <div 
                ref={conversationsContainerRef} 
                className="flex-1 overflow-y-auto bg-white"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="animate-spin h-6 w-6 text-blue-500" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                    <MessageSquare size={48} className="text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No conversations yet</p>
                    <p className="text-sm text-center mt-2">Customer messages will appear here</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <ConversationItem
                      key={conversation._id}
                      conversation={conversation}
                      onSelect={() => setSelectedConversation(conversation)}
                      isSelected={false}
                      onDelete={handleDeleteConversation}
                      searchTerm={searchTerm}
                      formatTime={formatTime}
                      isOnline={isCustomerOnline(conversation.customer?._id)}
                      isMobile={isMobile}
                    />
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Mobile Messages View */
            <div className="w-full h-full flex flex-col">
              {/* Mobile Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center">
                <button 
                  onClick={() => setSelectedConversation(null)}
                  className="p-2 hover:bg-white/10 rounded-full mr-3"
                >
                  <ArrowLeft size={20} />
                </button>
                
                <div className="flex items-center flex-1">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    isCustomerOnline(selectedConversation.customer?._id) 
                      ? 'bg-green-400' 
                      : 'bg-gray-400'
                  }`}></div>
                  <div>
                    <h2 className="font-semibold">
                      {selectedConversation.customer?.name || 'Customer'}
                    </h2>
                    <p className="text-xs text-blue-100">
                      {isCustomerOnline(selectedConversation.customer?._id) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Mobile Messages Container - FIXED */}
              <div className="flex-1 overflow-y-auto">
                <MessagesList
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
                  ref={messagesEndRef}
                />
              </div>
              
              {/* Mobile Message Input - FIXED */}
              <div className="bg-white border-t shadow-lg">
                <MessageInput
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  onSubmit={handleSubmitMessage}
                  onTyping={handleAdminTyping}
                  isSending={isSending}
                  attachment={attachment}
                  attachmentPreview={attachmentPreview}
                  onFileChange={handleFileChange}
                  onRemoveAttachment={handleRemoveAttachment}
                  isMobile={isMobile}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        /* Desktop: Show sidebar and messages side by side */
        <>
          {/* Desktop Sidebar - Conversations list */}
          <div className="w-80 border-r flex flex-col h-full bg-gray-50">
            {/* Search bar */}
            <div className="p-4 border-b bg-white">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>
            
            {/* Conversations list */}
            <div 
              ref={conversationsContainerRef} 
              className="flex-1 overflow-y-auto"
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader className="animate-spin h-5 w-5 text-gray-500" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageSquare size={32} />
                  <p className="mt-2">No conversations yet</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation._id}
                    conversation={conversation}
                    onSelect={() => setSelectedConversation(conversation)}
                    isSelected={selectedConversation?._id === conversation._id}
                    onDelete={handleDeleteConversation}
                    searchTerm={searchTerm}
                    formatTime={formatTime}
                    isOnline={isCustomerOnline(conversation.customer?._id)}
                    isMobile={isMobile}
                  />
                ))
              )}
            </div>
          </div>

          {/* Desktop Main content - Messages */}
          <div className="flex-1 flex flex-col h-full">
            {selectedConversation ? (
              <>
                {/* Desktop Conversation header */}
                <div className="flex items-center justify-between p-4 bg-gray-100 border-b">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      isCustomerOnline(selectedConversation.customer?._id) 
                        ? 'bg-green-500' 
                        : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <h2 className="text-lg font-semibold">
                        {selectedConversation.customer?.name || 'Customer'}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {isCustomerOnline(selectedConversation.customer?._id) ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Desktop Messages list */}
                <div className="flex-1 overflow-y-auto p-4">
                  <MessagesList
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
                    ref={messagesEndRef}
                  />
                </div>
                
                {/* Desktop Message input */}
                <div className="border-t">
                  <MessageInput
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    onSubmit={handleSubmitMessage}
                    onTyping={handleAdminTyping}
                    isSending={isSending}
                    attachment={attachment}
                    attachmentPreview={attachmentPreview}
                    onFileChange={handleFileChange}
                    onRemoveAttachment={handleRemoveAttachment}
                    isMobile={isMobile}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageSquare size={48} />
                <p className="mt-4 text-lg">Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Edit message modal */}
      {messageToEdit && (
        <EditMessageModal
          message={messageToEdit}
          onSave={handleSaveEdit}
          onCancel={() => setMessageToEdit(null)}
        />
      )}
    </div>
  );
};

export default AdminMessage;