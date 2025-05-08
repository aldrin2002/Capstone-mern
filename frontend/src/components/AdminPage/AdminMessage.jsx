import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
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
  SearchX
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
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Load conversations and connect to socket
  useEffect(() => {
    const fetchConversations = async () => {
      try {
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
        
        // Connection events
        socketRef.current.on('connect', () => {
          console.log("Admin socket connected with ID:", socketRef.current.id);
          setIsSocketConnected(true);
          // Explicitly announce admin connection to server
          socketRef.current.emit('admin-connected');
          toast.success("Connected to chat server");
          
          // Setup message handlers here, INSIDE the connect event
          setupMessageHandlers();
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
    
    fetchConversations();
    const connected = connectSocket();
    
    // Polling for updates every 30 seconds
    const intervalId = setInterval(fetchConversations, 30000);
    
    // Clean up
    return () => {
      clearInterval(intervalId);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Add this function to set up message handlers
  const setupMessageHandlers = () => {
    if (!socketRef.current) return;
    
    // Remove any existing listeners to prevent duplicates
    socketRef.current.off('new-message');
    
    // Set up new-message handler
    socketRef.current.on('new-message', (message) => {
      console.log("New message received by admin:", message);
      
      // Update messages if the message belongs to the current conversation
      if (selectedConversation && message.conversation === selectedConversation._id) {
        setMessages(prevMessages => {
          // Check if message already exists
          const messageExists = prevMessages.some(m => m._id === message._id);
          if (messageExists) return prevMessages;
          
          // Add new message
          return [...prevMessages, message];
        });
        
        // Mark the message as read since admin is viewing this conversation
        socketRef.current.emit('mark-read', { conversationId: selectedConversation._id });
      }
      
      // Always update conversations list with new message info
      setConversations(prev => 
        prev.map(conv => {
          if (conv._id === message.conversation && message.sender.role === 'customer') {
            return { 
              ...conv, 
              unreadCount: (conv.unreadCount || 0) + 1, 
              lastMessage: new Date() 
            };
          }
          return conv;
        })
      );
    });
  };

  // Set up message event listeners in a separate useEffect that depends on selectedConversation
  useEffect(() => {
    if (!socketRef.current || !socketRef.current.connected) {
      return;
    }
    
    // Remove any existing listeners to prevent duplicates
    socketRef.current.off('new-message');
    
    // Set up new-message handler that works with the current selectedConversation
    socketRef.current.on('new-message', (message) => {
      console.log("New message received by admin:", message);
      
      // Update messages if the message belongs to the current conversation
      if (selectedConversation && message.conversation === selectedConversation._id) {
        setMessages(prevMessages => {
          // Check if message already exists
          const messageExists = prevMessages.some(m => m._id === message._id);
          if (messageExists) return prevMessages;
          
          // Add new message
          return [...prevMessages, message];
        });
      }
      
      // Always update conversations list with new message info
      setConversations(prev => 
        prev.map(conv => {
          if (conv._id === message.conversation && message.sender.role === 'customer') {
            return { 
              ...conv, 
              unreadCount: (conv.unreadCount || 0) + 1, 
              lastMessage: new Date() 
            };
          }
          return conv;
        })
      );
    });
    
    // Mark as read when conversation changes
    if (selectedConversation) {
      socketRef.current.emit('mark-read', { conversationId: selectedConversation._id });
    }
    
    return () => {
      // Clean up listener when component unmounts or selectedConversation changes
      if (socketRef.current) {
        socketRef.current.off('new-message');
      }
    };
  }, [selectedConversation, socketRef.current?.connected]);

  // Add a useEffect to reconnect socket if selected conversation changes
  useEffect(() => {
    if (selectedConversation && socketRef.current) {
      // Mark messages as read when conversation changes
      socketRef.current.emit('mark-read', { conversationId: selectedConversation._id });
    }
  }, [selectedConversation]);

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

  const fetchMessages = async (conversationId) => {
    setIsLoadingMessages(true);
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
      setIsLoadingMessages(false);
    }
  };

  // Update this function to allow browsing history
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Get the container element (parent of the messages)
      const container = messagesEndRef.current.parentElement.parentElement;
      
      // Check if user is already near bottom (within 300px of bottom)
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
      
      // Only auto-scroll if user is already near the bottom
      if (isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
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

  return (
    <div className="p-4 md:p-6 h-full bg-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6">
        <h2 className="text-2xl font-bold text-blue-900 flex items-center">
          <MessageSquare className="h-6 w-6 mr-2 text-blue-600" /> 
          Customer Conversations
          {isSocketConnected && (
            <span className="ml-2 flex items-center text-sm font-normal text-green-600">
              <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
              Live
            </span>
          )}
        </h2>
        
        <div className="mt-2 md:mt-0 flex items-center">
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center hover:bg-blue-700"
            onClick={() => {/* Refresh conversations */}}
          >
            <RefreshCw size={16} className="mr-1" /> Refresh
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden h-[calc(100vh-180px)]">
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          {/* Conversation List */}
          <div className="md:col-span-1 border-r border-gray-200">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <div className="overflow-y-auto h-[calc(100vh-280px)]">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <SearchX size={24} className="mx-auto mb-2 text-gray-400" />
                    No conversations found
                  </div>
                ) : (
                  <>
                    {/* Group conversations by date */}
                    {['Today', 'Yesterday', 'Earlier this week', 'Earlier'].map(dateGroup => {
                      const conversationsInGroup = filteredConversations.filter(conv => {
                        const messageDate = new Date(conv.lastMessage || conv.createdAt);
                        // Logic to determine if conversation belongs in this group
                        return formatDate(messageDate) === dateGroup;
                      });
                      
                      if (conversationsInGroup.length === 0) return null;
                      
                      return (
                        <div key={dateGroup}>
                          <div className="sticky top-0 bg-gray-100 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {dateGroup}
                          </div>
                          
                          {conversationsInGroup.map((conv) => (
                            <div
                              key={conv._id}
                              className={`p-4 border-l-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                                selectedConversation?._id === conv._id 
                                  ? 'bg-blue-50 border-l-blue-500' 
                                  : conv.unreadCount > 0
                                    ? 'border-l-amber-400' 
                                    : 'border-l-transparent'
                              }`}
                              onClick={() => setSelectedConversation(conv)}
                            >
                              <div className="flex items-center">
                                <div className="flex-shrink-0 mr-3">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                                    {conv.customer?.name?.charAt(0).toUpperCase() || 'C'}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center mb-1">
                                    <h3 className="text-sm font-medium truncate">{conv.customer?.name || 'Customer'}</h3>
                                    <span className="text-xs text-gray-500 flex items-center">
                                      <Clock size={12} className="mr-1" />
                                      {formatTime(conv.lastMessage || conv.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 truncate mb-1">{conv.customer?.email}</p>
                                  
                                  {/* Last message preview */}
                                  <p className="text-xs truncate text-gray-600">
                                    {conv.lastMessageContent || 'Start a conversation...'}
                                  </p>
                                  
                                  <div className="flex items-center mt-1">
                                    {conv.unreadCount > 0 && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {conv.unreadCount} new
                                      </span>
                                    )}
                                    
                                    {conv.status === 'active' && (
                                      <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Messages */}
          <div className="md:col-span-2 flex flex-col h-full">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h2 className="font-medium">{selectedConversation.customer?.name || 'Customer'}</h2>
                      <p className="text-sm text-gray-500">{selectedConversation.customer?.email}</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={20} />
                  </button>
                </div>
                
                {/* Messages Area */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50 h-[calc(100vh-350px)] relative">
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
                                        className={`rounded-lg px-4 py-2 ${
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
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                  
                  {/* Scroll to bottom button */}
                  {showScrollButton && (
                    <button
                      onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                      className="absolute bottom-4 right-4 bg-blue-500 text-white rounded-full p-2 shadow-lg hover:bg-blue-600 transition-all animate-bounce-subtle"
                    >
                      <ArrowDown size={20} />
                    </button>
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
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessage;