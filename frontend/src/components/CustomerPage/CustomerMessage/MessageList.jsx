import React, { useEffect } from "react";
import { Send, MessageCircle, User } from "lucide-react";
import MessageGroup from "./MessageGroup";
import { formatDate } from "./messageUtils";

const MessageList = ({ 
  messages,
  isLoading,
  messagesContainerRef,
  messagesEndRef,
  isAdminTyping,
  API_BASE_URL,
  isMobile
}) => {
  // Force initial scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0 && !isLoading && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [isLoading, messages.length]);

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto px-6 pt-3 relative"
      style={{ 
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(241, 62, 147, 0.3) transparent",
        // Reserve space for fixed input (desktop ~100px, mobile already bigger)
        paddingBottom: isMobile ? "180px" : "115px"
      }}  
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-brand rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin animate-reverse"></div>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-lg border border-white/50">
              <Send className="h-12 w-12 text-brand" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <MessageCircle size={16} className="text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700 mb-2">No messages yet</p>
            <p className="text-sm text-gray-500">Start the conversation with the store owner!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
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
              <div className="flex justify-center my-6">
                <div className="relative">
                  <span className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium text-gray-600 shadow-lg border border-gray-200/50">
                    {formatDate(date)}
                  </span>
                </div>
              </div>
              
              <MessageGroup 
                dateMessages={dateMessages}
                API_BASE_URL={API_BASE_URL}
              />
            </div>
          ))}

          {/* Enhanced typing indicator */}
          {isAdminTyping && (
            <div className="flex items-center mt-4 animate-fade-in">
              <div className="relative mr-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-primary-700 flex items-center justify-center shadow-lg border-2 border-white">
                  <User size={16} className="text-white" />
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl rounded-bl-lg px-5 py-3 text-gray-600 shadow-lg border border-gray-200/50">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-brand rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <span className="ml-2 text-xs font-medium">Store owner is typing...</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Scroll reference element */}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default MessageList;