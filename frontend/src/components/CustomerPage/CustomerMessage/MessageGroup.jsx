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
        className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} mb-2`}
      >
        {/* Avatar for admin (left side) */}
        {!isCustomer && (
          <div className="h-8 w-8 rounded-full bg-gray-400 flex-shrink-0 mr-2 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
        )}
        
        <div className={`max-w-[70%] ${isCustomer ? 'mr-2' : ''}`}>
          <div className="space-y-1">
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
        
        {/* Avatar for customer (right side) */}
        {isCustomer && (
          <div className="h-8 w-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
        )}
      </div>
    );
  });
};

export default MessageGroup;