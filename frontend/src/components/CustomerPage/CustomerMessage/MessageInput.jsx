import React from "react";
import { Send, Image, X } from "lucide-react";

const MessageInput = ({ 
  newMessage, 
  setNewMessage, 
  handleTyping, 
  handleSendMessage, 
  handleFileChange,
  handleRemoveImage, // Add this new prop
  fileInputRef,
  isMobile,
  isTyping,
  isSending,
  imageFile,
  imagePreview,
  uploadProgress = 0
}) => {
  return (
    <div className="bg-white border-t border-gray-200 p-4 z-10 relative">
      <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
        {/* Image preview */}
        {imagePreview && (
          <div className="mb-4 relative">
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-20 rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={handleRemoveImage} // Use the new handler
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
          >
            <Image size={20} />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type your message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSending}
            />
            
            {uploadProgress > 0 && (
              <div className="absolute left-0 bottom-0 h-1 bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSending || (!newMessage.trim() && !imageFile)}
            className={`p-3 rounded-lg text-white ${
              isSending || (!newMessage.trim() && !imageFile)
                ? 'bg-gray-400' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </form>
    </div>
  );
};

export default MessageInput;