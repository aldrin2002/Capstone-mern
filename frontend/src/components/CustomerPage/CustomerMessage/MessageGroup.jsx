import React from "react";
import { User } from "lucide-react";
import MessageItem from "./MessageItem";

const MessageGroup = ({ dateMessages, API_BASE_URL }) => {
  // Group consecutive messages by same sender
  const messageGroups = dateMessages.reduce((groups, message, index) => {
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
  }, []);

  return messageGroups.map((group, groupIndex) => {
    const isCustomer = group[0].sender.role === 'customer';
    
    return (
      <div 
        key={groupIndex} 
        className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} mb-6 animate-fade-in`}
      >
        {!isCustomer && (
          <div className="relative mr-3 mt-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg border-2 border-white">
              <User size={16} className="text-white" />
            </div>
          </div>
        )}
        
        <div className="max-w-[75%]">
          <div className="space-y-2">
            {group.map((message, index) => (
              <MessageItem 
                key={message._id}
                message={message}
                isCustomer={isCustomer}
                index={index}
                API_BASE_URL={API_BASE_URL}
              />
            ))}
          </div>
        </div>
        
        {isCustomer && (
          <div className="relative ml-3 mt-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg border-2 border-white">
              <User size={16} className="text-white" />
            </div>
          </div>
        )}
      </div>
    );
  });
};

export default MessageGroup;