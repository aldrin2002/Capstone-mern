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
    <>
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
            {/* Enhanced date divider */}
            <div className="flex justify-center my-6">
              <div className="relative">
                <span className="px-4 py-2 bg-gradient-to-r from-blue-100/80 to-purple-100/80 backdrop-blur-sm rounded-full text-xs text-gray-600 font-semibold border border-white/50 shadow-lg">
                  {formatDate(date)}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-sm opacity-50"></div>
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
                  className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}
                  style={{ animationDelay: `${groupIndex * 100}ms` }}
                >
                  {/* Enhanced customer avatar */}
                  {!isAdmin && (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex-shrink-0 mr-3 mt-1 flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300">
                      <User size={18} className="text-white" />
                    </div>
                  )}
                  
                  <div className="max-w-[75%]">
                    {/* Enhanced sender name */}
                    <div className={`text-xs mb-2 ${isAdmin ? 'text-right' : ''}`}>
                      <span className={`font-bold px-2 py-1 rounded-full ${
                        isAdmin 
                          ? 'text-blue-600 bg-blue-100/50' 
                          : 'text-gray-600 bg-gray-100/50'
                      }`}>
                        {isAdmin ? 'You' : group[0].sender.name || 'Customer'}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {group.map((message, messageIndex) => (
                        <div 
                          key={message._id}
                          className={`animate-slide-in ${isAdmin ? 'animate-slide-in-admin' : 'animate-slide-in-customer'}`}
                          style={{ animationDelay: `${(groupIndex * 100) + (messageIndex * 50)}ms` }}
                        >
                          <MessageItem
                            message={message}
                            isAdmin={isAdmin}
                            onDelete={onDeleteMessage}
                            onEdit={onEditMessage}
                            formatTime={formatTime}
                            API_BASE_URL={API_BASE_URL}
                            isDeleting={isDeleting}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Enhanced admin avatar */}
                  {isAdmin && (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 ml-3 mt-1 flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300">
                      <User size={18} className="text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Enhanced typing indicator */}
        {selectedConversation && typingCustomers[selectedConversation.customer?._id] && (
          <div className="flex items-center mt-4 animate-fade-in">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex-shrink-0 mr-3 flex items-center justify-center shadow-lg">
              <User size={18} className="text-white" />
            </div>
            <div className="bg-gradient-to-r from-white to-gray-50/80 backdrop-blur-sm rounded-2xl px-5 py-3 text-gray-500 inline-block border border-gray-200/50 shadow-lg">
              <div className="flex items-center space-x-1">
                <span className="h-2 w-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="h-2 w-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                <span className="h-2 w-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={ref} />
      </div>

      {/* Custom animations - moved outside and fixed the isAdmin issue */}
      <style jsx>{`
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
        
        @keyframes slide-in-admin {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-customer {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .animate-slide-in-admin {
          animation: slide-in-admin 0.4s ease-out forwards;
        }
        
        .animate-slide-in-customer {
          animation: slide-in-customer 0.4s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
});

MessagesList.displayName = 'MessagesList';

export default MessagesList;