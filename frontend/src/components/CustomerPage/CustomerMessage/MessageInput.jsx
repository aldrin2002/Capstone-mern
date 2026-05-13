import React from "react";
import { Send, Image, X } from "lucide-react";

const MessageInput = ({ 
  newMessage, 
  setNewMessage, 
  handleTyping, 
  handleSendMessage, 
  handleFileChange,
  handleRemoveImage,
  fileInputRef,
  isMobile,
  isTyping,
  isSending,
  imageFile,
  imagePreview,
  uploadProgress = 0
}) => {
  return (
    <div className="bg-white border-t border-gray-200 z-10 relative">
      {/* Image preview - Positioned ABOVE the input area with absolute positioning */}
      {imagePreview && (
        <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-20 rounded-lg border border-gray-200 shadow-sm"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md transition-colors"
                title="Remove image"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Image ready to send</p>
          </div>
        </div>
      )}

      {/* Input form - Fixed height container */}
      <form onSubmit={handleSendMessage} className="p-4">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          {/* Image upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
              isSending 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-100 hover:bg-primary-200 text-brand'
            }`}
            title="Attach image"
          >
            <Image size={20} />
          </button>
          
          {/* Text input with progress bar */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type your message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
              disabled={isSending}
            />
            
            {/* Upload progress indicator */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="absolute left-0 bottom-0 h-1 bg-brand transition-all duration-300 rounded-b-lg" 
                   style={{ width: `${uploadProgress}%` }}>
              </div>
            )}
          </div>
          
          {/* Send button */}
          <button
            type="submit"
            disabled={isSending || (!newMessage.trim() && !imageFile)}
            className={`p-3 rounded-lg text-white flex-shrink-0 transition-all ${
              isSending || (!newMessage.trim() && !imageFile)
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-brand hover:bg-primary-700 hover:shadow-md'
            }`}
            title="Send message"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        
        {/* Hidden file input */}
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