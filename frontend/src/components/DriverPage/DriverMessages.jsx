import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Loader, Search, MessageSquare, ArrowLeft } from "lucide-react";
import DriverSideNav from "../../pages/driver/driverSideNav";
import { useMessageNotifications } from "../../context/MessageNotificationContext";
import MessagesList from "../AdminPage/MessagesList";
import MessageInput from "../AdminPage/MessageInput";

const API_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
const API_URL = `${API_BASE_URL}/api/messages`;

const DriverMessages = () => {
  const { socket, isConnected, setMessagesPageActive, resetUnreadCount } = useMessageNotifications();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Resize watcher
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mark messages page active for unread logic
  useEffect(() => {
    setMessagesPageActive(true);
    resetUnreadCount();
    return () => setMessagesPageActive(false);
  }, [setMessagesPageActive, resetUnreadCount]);

  // Load conversations (no auto-select here; we handle selection in another effect)
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_URL}/conversations`, { withCredentials: true });
        const list = res.data || [];
        setConversations(list);
      } catch (e) {
        console.error("Error fetching conversations:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // Auto-select first conversation on desktop only
  useEffect(() => {
    if (!isMobile && !selectedConversation && conversations.length) {
      setSelectedConversation(conversations[0]);
    }
  }, [isMobile, conversations, selectedConversation]);

  // Load messages on selection
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;
      setIsLoadingMessages(true);
      try {
        const res = await axios.get(`${API_URL}/${selectedConversation._id}`, { withCredentials: true });
        setMessages(res.data || []);
        if (socket && isConnected) socket.emit("join-conversation", selectedConversation._id);
        if (socket) socket.emit("mark-read", { conversationId: selectedConversation._id });
      } catch (e) {
        console.error("Error fetching messages:", e);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedConversation, socket, isConnected]);

  // Socket: new-message
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message) => {
      if (!selectedConversation) return;
      const convId = message.conversation?._id || message.conversation;
      if (convId === selectedConversation._id) {
        setMessages((prev) => [...prev, message]);
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    };
    socket.on("new-message", handleNewMessage);
    return () => socket.off("new-message", handleNewMessage);
  }, [socket, selectedConversation]);

  // Join all rooms on connect
  useEffect(() => {
    if (socket && isConnected && conversations.length) {
      conversations.forEach((conv) => socket.emit("join-conversation", conv._id));
    }
  }, [socket, isConnected, conversations]);

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const filteredConversations = conversations.filter((c) => {
    const name = c.customer?.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachment(file);
    const reader = new FileReader();
    reader.onload = () => setAttachmentPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const onRemoveAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmitMessage = async (e) => {
    e.preventDefault();
    if (!socket || !isConnected || !selectedConversation) return;
    if (!newMessage.trim() && !attachment) return;

    try {
      setIsSending(true);

      let attachmentPath = null;
      if (attachment) {
        const formData = new FormData();
        formData.append("attachment", attachment);
        const uploadRes = await axios.post(`${API_BASE_URL}/api/messages/attachment`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
        attachmentPath = uploadRes.data?.filePath || null;
      }

      socket.emit("send-message", {
        conversationId: selectedConversation._id,
        content: newMessage.trim(),
        attachment: attachmentPath,
      });

      setNewMessage("");
      onRemoveAttachment();
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Mobile-first visibility toggles
  const showSidebar = !(isMobile && selectedConversation);
  const showMessages = !isMobile || !!selectedConversation;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DriverSideNav />

      {/* make main control overflow; panes manage their own scroll */}
      <main className={`flex-1 ${isMobile ? "pb-20" : "ml-64"} overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-xl m-4">
          <div className="relative px-6 py-6 flex items-center justify-between text-white">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-2">
                <MessageSquare className="h-4 w-4 mr-2" />
                Driver Messages
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">Customer Conversations</h1>
              <p className="text-blue-100 text-sm">Chat with customers in real-time</p>
            </div>
          </div>
        </div>

        <div
          className={`grid ${showSidebar && showMessages ? "lg:grid-cols-3 grid-cols-1" : "grid-cols-1"} ${
            isMobile ? "gap-0" : "gap-4"
          } m-4`}
        >
          {/* Sidebar: conversations */}
          <div
            className={`bg-white rounded-2xl shadow-lg border overflow-hidden ${
              showSidebar ? "" : "hidden"
            } lg:block`}
          >
            <div className="p-4 border-b flex items-center gap-2 sticky top-0 bg-white z-10">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="flex-1 outline-none text-sm"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={handleSearch}
                autoComplete="off"
              />
            </div>
            {/* SIMPLE: one scroll area, fixed height per viewport */}
            <div
              className="overflow-y-auto divide-y"
              style={{ height: isMobile ? "calc(100dvh - 200px)" : "70vh" }}
            >
              {isLoading ? (
                <div className="p-6 flex items-center justify-center">
                  <Loader className="h-5 w-5 animate-spin text-gray-500" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <MessageSquare className="mx-auto mb-2" />
                  No conversations
                </div>
              ) : (
                filteredConversations.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => setSelectedConversation(c)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${
                      selectedConversation?._id === c._id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{c.customer?.name || "Customer"}</div>
                    <div className="text-xs text-gray-600">
                      {new Date(c.lastMessage || c.createdAt).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {c.lastMessageContent || "No messages yet"}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            className={`lg:col-span-2 bg-white rounded-2xl shadow-lg border overflow-hidden ${
              showMessages ? "flex" : "hidden"
            } flex-col`}
          >
            {selectedConversation ? (
              <>
                <div className="p-4 bg-gray-100 border-b flex items-center">
                  {isMobile && (
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="p-2 hover:bg-white/10 rounded-full mr-3"
                    >
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <div>
                    <h2 className="font-semibold">{selectedConversation.customer?.name || "Customer"}</h2>
                    <p className="text-xs text-gray-500">Order Thread</p>
                  </div>
                </div>

                <div
                  className="overflow-y-auto px-2"
                  style={{ height: isMobile ? "calc(100dvh - 200px)" : "70vh" }}
                >
                  <MessagesList
                    messages={messages}
                    isLoadingMessages={isLoadingMessages}
                    formatTime={(d) =>
                      new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    }
                    formatDate={(d) => new Date(d).toLocaleDateString()}
                    onDeleteMessage={() => {}}
                    onEditMessage={() => {}}
                    typingCustomers={{}}
                    selectedConversation={selectedConversation}
                    API_BASE_URL={API_BASE_URL}
                    isDeleting={false}
                    isMobile={isMobile}
                  />
                  <div ref={messagesEndRef} />
                </div>

                {/* keep input pinned; it won’t affect the scroll area height above */}
                <div className="border-t bg-white sticky bottom-0">
                  <MessageInput
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    onSubmit={onSubmitMessage}
                    onTyping={() => {}}
                    isSending={isSending}
                    attachment={attachmentPreview}
                    attachmentPreview={attachmentPreview}
                    onFileChange={onFileChange}
                    onRemoveAttachment={onRemoveAttachment}
                    isMobile={isMobile}
                    fileInputRef={fileInputRef}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <MessageSquare size={32} />
                <span className="ml-2">Select a conversation</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverMessages;