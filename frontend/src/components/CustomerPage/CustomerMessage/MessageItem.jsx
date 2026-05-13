import React, { useState } from "react";
import { Clock } from "lucide-react";
import { formatTime } from "./messageUtils";

const MessageItem = ({ message, isCustomer, index, API_BASE_URL }) => {
  const [imageError, setImageError] = useState(false);

  // Improved function to handle image URLs correctly for all cases
  const getImageUrl = (attachment) => {
    // Skip processing if attachment is falsy
    if (!attachment) return '';
    
    try {
      // Case 1: Already a complete URL (Cloudinary or otherwise)
      if (attachment.includes('cloudinary.com') || attachment.startsWith('http')) {
        return attachment;
      } 
      // Case 2: Data URL (base64)
      else if (attachment.startsWith('data:')) {
        return attachment;
      }
      // Case 3: Path from backend without API_BASE_URL
      else if (attachment.startsWith('/uploads/')) {
        return `${API_BASE_URL}${attachment}`;
      }
      // Case 4: Any other format - append API_BASE_URL as fallback
      else {
        return `${API_BASE_URL}${attachment}`;
      }
    } catch (error) {
      console.error("Error processing image URL:", error);
      return '';
    }
  };

  // Fallback image handler
  const handleImageError = () => {
    console.error("Image failed to load:", message.attachment);
    setImageError(true);
  };

  return (
    <div className={`group relative ${isCustomer ? 'ml-auto' : ''} w-fit`}>
      <div 
        className={`px-4 py-2 rounded-xl inline-block ${
          isCustomer 
            ? 'bg-brand text-white' 
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        {/* Message attachment with error handling */}
        {message.attachment && !imageError && (
          <div className="mb-2">
            <img 
              src={getImageUrl(message.attachment)}
              alt="Attachment" 
              className="rounded-lg max-h-60 max-w-full cursor-pointer"
              onClick={() => window.open(getImageUrl(message.attachment), '_blank')}
              onError={handleImageError}
            />
          </div>
        )}

        {/* Fallback for failed images */}
        {message.attachment && imageError && (
          <div className="mb-2 p-3 bg-gray-100 rounded-lg text-gray-500 text-sm text-center">
            Image couldn't be loaded
          </div>
        )}

        {/* Message content */}
        {message.content && (
          <p className="break-words">{message.content}</p>
        )}
        
        {/* Message time - Fixed to align properly regardless of message length */}
        <div className={`text-xs mt-1 ${
          isCustomer ? 'text-primary-100 text-right' : 'text-gray-500'
        } clear-both`}>
          {formatTime(message.timestamp || message.createdAt)}
          
          {isCustomer && message.isRead && (
            <span className="ml-2 inline-block w-2 h-2 bg-green-300 rounded-full"></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;