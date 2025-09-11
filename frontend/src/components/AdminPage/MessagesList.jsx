import { forwardRef } from "react";
import { Send, User, Sparkles, Loader } from "lucide-react";
import MessageItem from "./MessageItem";

const MessagesList = forwardRef(({ 
  messages, 
  isLoadingMessages, 
  formatTime, 
  formatDate, 
  onDeleteMessage, 
  onEditMessage, 
  typingCustomers, 
  selectedConversation, 
  API_BASE_URL,
  isDeleting,
  isMobile 
}, ref) => {
  if (isLoadingMessages) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader className="h-8 w-8 text-blue-500 animate-spin" />
            <div className="absolute inset-0 h-8 w-8 border-4 border-purple-500/30 rounded-full animate-ping"></div>
          </div>
          <p className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Loading messages...
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="p-6 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-full mb-6 shadow-xl backdrop-blur-sm transform hover:scale-110 transition-all duration-500">
          <Send className="h-12 w-12 text-blue-400 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-600 to-blue-600 bg-clip-text text-transparent mb-2">
          No messages yet
        </h3>
        <p className="text-gray-400 text-center">Start the conversation and see your messages here!</p>
        <div className="mt-4 flex items-center space-x-2 text-blue-400">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span className="text-sm font-medium">Begin chatting</span>
          <Sparkles className="h-4 w-4 animate-pulse delay-1000" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ maxHeight: "calc(100vh - 160px)" }}>
      <div className="space-y-4 pb-4">
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
            {/* Enhanced date divider */}
            <div className="flex justify-center my-4">
              <div className="relative">
                <span className="px-4 py-1 bg-gradient-to-r from-blue-100/80 to-purple-100/80 backdrop-blur-sm rounded-full text-xs text-gray-600 font-semibold border border-white/50 shadow-md">
                  {formatDate(date)}
                </span>
              </div>
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
                  className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-2`}
                >
                  {/* Customer avatar (only show for first message in group) */}
                  {!isAdmin && (
                    <div className="h-8 w-8 rounded-full bg-gray-400 flex-shrink-0 mr-2 flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[70%] ${isAdmin ? 'mr-2' : ''}`}>
                    <div className="space-y-1">
                      {group.map((message) => (
                        <MessageItem
                          key={message._id}
                          message={message}
                          isAdmin={isAdmin}
                          onDelete={onDeleteMessage}
                          onEdit={onEditMessage}
                          formatTime={formatTime}
                          API_BASE_URL={API_BASE_URL}
                          isDeleting={isDeleting}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Admin avatar (only show for first message in group) */}
                  {isAdmin && (
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Typing indicator */}
        {selectedConversation && typingCustomers[selectedConversation.customer?._id] && (
          <div className="flex items-center mt-2">
            <div className="h-8 w-8 rounded-full bg-gray-400 flex-shrink-0 mr-2 flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="bg-gray-200 px-4 py-2 rounded-xl max-w-[70%]">
              <div className="flex items-center space-x-1">
                <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></span>
              </div>
            </div>
          </div>
        )}
        
        {/* Scroll target */}
        <div ref={ref} />
      </div>

      {/* Custom scrollbar */}
      <style>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
});

MessagesList.displayName = 'MessagesList';

export default MessagesList;