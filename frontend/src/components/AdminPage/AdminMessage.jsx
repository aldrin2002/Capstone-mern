import { useState } from "react";
import { toast } from "react-hot-toast";
import { 
  Search, 
  Loader,
  MessageSquare,
  SearchX,
  ArrowLeft
} from "lucide-react";

// Import the components
import useConversationManager from "./ConversationManager";
import ConversationItem from "./ConversationItem";
import MessagesList from "./MessagesList";
import MessageInput from "./MessageInput";
import EditMessageModal from "./EditMessageModal";

const AdminMessage = () => {
  // Local state for UI components
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  // Get all state and functions from ConversationManager
  const conversationManager = useConversationManager();

  // Event handlers
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

  const handleSubmitMessage = (e) => {
    conversationManager.handleSubmitMessage(
      e, 
      newMessage, 
      attachment, 
      setNewMessage, 
      setAttachment, 
      setAttachmentPreview, 
      setIsSending
    );
  };

  // Filter conversations
  const filteredConversations = conversationManager.conversations.filter(conv => 
    conv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`h-screen bg-gray-50 ${conversationManager.isMobile ? 'pb-16' : 'p-4'}`}>
      {/* Mobile header */}
      {conversationManager.isMobile && conversationManager.selectedConversation ? (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
          <div className="flex items-center h-14 px-4">
            <button 
              onClick={() => conversationManager.setSelectedConversation(null)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="ml-2 flex-1">
              <h2 className="font-medium truncate">{conversationManager.selectedConversation.customer?.name || 'Customer'}</h2>
              <p className="text-xs text-gray-500 truncate">{conversationManager.selectedConversation.customer?.email}</p>
            </div>
            {conversationManager.isCustomerOnline(conversationManager.selectedConversation.customer?._id) && (
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
            {conversationManager.isSocketConnected && (
              <span className="ml-2 flex items-center text-sm font-normal text-green-600">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                Live
              </span>
            )}
          </h2>
        </div>
      )}

      {/* Main container */}
      <div className={`${conversationManager.isMobile ? 'h-[calc(100vh-4rem)]' : 'h-full'} bg-white shadow-sm flex`}>
        {/* Conversations sidebar */}
        <div className={`${
          conversationManager.isMobile && conversationManager.selectedConversation ? 'hidden' : 'w-full'
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
            ref={conversationManager.conversationsContainerRef}
            className="flex-1 overflow-y-auto pt-3"
          >
            {conversationManager.isLoading ? (
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
                  isSelected={conversationManager.selectedConversation?._id === conv._id}
                  isOnline={conversationManager.isCustomerOnline(conv.customer?._id)}
                  onSelect={conversationManager.setSelectedConversation}
                  onDelete={conversationManager.handleDeleteConversation}
                  formatTime={conversationManager.formatTime}
                  isMobile={conversationManager.isMobile}
                />
              ))
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className={`${
          conversationManager.isMobile && !conversationManager.selectedConversation ? 'hidden' : 'w-full'
        } md:flex-1 flex flex-col bg-gray-50`}>
          {conversationManager.selectedConversation ? (
            <>
              {/* Messages container */}
              <div 
                ref={conversationManager.messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 py-6"
              >
                <MessagesList
                  ref={conversationManager.messagesEndRef}
                  messages={conversationManager.messages}
                  isLoadingMessages={conversationManager.isLoadingMessages}
                  formatTime={conversationManager.formatTime}
                  formatDate={conversationManager.formatDate}
                  onDeleteMessage={conversationManager.handleDeleteMessage}
                  onEditMessage={conversationManager.handleEditMessage}
                  typingCustomers={conversationManager.typingCustomers}
                  selectedConversation={conversationManager.selectedConversation}
                  API_BASE_URL={conversationManager.API_BASE_URL}
                  isDeleting={conversationManager.isDeleting}
                  isMobile={conversationManager.isMobile}
                />
              </div>

              {/* Message input */}
              <div className={conversationManager.isMobile ? 'fixed bottom-16 left-0 right-0' : 'flex-shrink-0 border-t border-gray-200'}>
                <MessageInput
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  onSubmit={handleSubmitMessage}
                  onTyping={conversationManager.handleAdminTyping}
                  isSending={isSending}
                  attachment={attachment}
                  onFileChange={handleFileChange}
                  isMobile={conversationManager.isMobile}
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
      {conversationManager.isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-3"></div>
            <p>Deleting...</p>
          </div>
        </div>
      )}

      {/* Edit message modal */}
      <EditMessageModal
        message={conversationManager.messageToEdit}
        editedContent={conversationManager.editedContent}
        setEditedContent={conversationManager.setEditedContent}
        onSave={conversationManager.handleSaveEdit}
        onClose={() => conversationManager.setMessageToEdit(null)}
      />
    </div>
  );
};

export default AdminMessage;