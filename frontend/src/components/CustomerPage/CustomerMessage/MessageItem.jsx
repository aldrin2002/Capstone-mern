import React from "react";
import { Clock } from "lucide-react";
import { formatTime } from "./messageUtils";

const MessageItem = ({ message, isCustomer, index, API_BASE_URL }) => {
  // Function to handle image URLs correctly for both Cloudinary and local uploads
  const getImageUrl = (attachment) => {
    // Check if this is a Cloudinary URL (contains cloudinary.com)
    if (attachment.includes('cloudinary.com')) {
      return attachment; // Return as is for Cloudinary URLs
    } 
    // Check if it's a data URL
    else if (attachment.startsWith('data:')) {
      return attachment; // Return as is for data URLs
    } 
    // Otherwise treat as local path
    else {
      return `${API_BASE_URL}${attachment}`; // Prepend API base for local paths
    }
  };

  return (
    <div
      className={`group relative animate-slide-in ${
        isCustomer ? 'animate-slide-in-right' : 'animate-slide-in-left'
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`relative rounded-2xl px-4 py-3 shadow-lg transform transition-all duration-300 hover:scale-[1.02] ${
        isCustomer 
          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-lg ml-auto' 
          : 'bg-white/90 backdrop-blur-sm text-gray-800 rounded-bl-lg border border-gray-200/50'
      }`}>
        {/* Message tail */}
        <div className={`absolute bottom-0 ${
          isCustomer 
            ? 'right-0 w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-blue-600' 
            : 'left-0 w-0 h-0 border-r-[12px] border-r-transparent border-t-[12px] border-t-white'
        }`}></div>
        
        {message.attachment && (
          <div className="mb-3 relative overflow-hidden rounded-xl">
            <img 
              src={getImageUrl(message.attachment)}
              alt="Attachment" 
              className="rounded-xl max-h-60 max-w-full cursor-pointer hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg"
              onClick={() => window.open(getImageUrl(message.attachment), '_blank')}
            />
          </div>
        )}
        
        {message.content && (
          <p className="leading-relaxed">{message.content}</p>
        )}
        
        <div className={`flex items-center text-xs mt-2 ${
          isCustomer ? 'text-blue-100 justify-end' : 'text-gray-500'
        }`}>
          <Clock size={12} className="mr-1.5" />
          <span className="font-medium">{formatTime(message.timestamp || message.createdAt)}</span>
          
          {isCustomer && (
            <div className="ml-2 flex items-center">
              <div className={`w-3 h-3 rounded-full ${
                message.isRead ? 'bg-green-300' : 'bg-blue-300'
              } animate-pulse`}></div>
              <span className="ml-1 text-xs font-medium">
                {message.isRead ? "Read" : "Sent"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;