import React from "react";
import { Send, Image, X } from "lucide-react";
import { MOBILE_NAV_HEIGHT } from "../../../pages/customer/customerSideNav";

const MessageInput = ({ 
  newMessage, 
  setNewMessage, 
  handleTyping, 
  handleSendMessage, 
  handleFileChange,
  fileInputRef,
  isMobile,
  isTyping,
  isSending,
  imageFile,
  imagePreview,
  uploadProgress = 0, // Provide default value of 0
  playSendSound = false // Add this optional prop
}) => {
  const handleSendWithSound = (e) => {
    handleSendMessage(e);
    
    // Optionally play a "sent" sound if needed
    if (playSendSound && window.audioService) {
      window.audioService.playSentSound();
    }
  };

  return (
    <div 
      className="relative bg-white/80 backdrop-blur-xl border-t border-white/20 p-4 shrink-0 z-10 shadow-lg"
      style={isMobile ? { 
        position: "fixed", 
        bottom: `${MOBILE_NAV_HEIGHT}px`, 
        left: 0, 
        right: 0,
        zIndex: 30,
        boxShadow: "0 -10px 30px rgba(0,0,0,0.1)"
      } : {}}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none"></div>
      
      <form onSubmit={handleSendWithSound} className="relative flex flex-col max-w-4xl mx-auto">
        {/* Image preview */}
        {imagePreview && (
          <div className="mb-4 relative">
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-20 rounded-lg border border-gray-200 shadow-md"
              />
              <button
                type="button"
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
        
        {/* Upload Progress Bar */}
        {isSending && uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-3 w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <p className="text-xs text-gray-500 text-center mt-1">
              Uploading image... {uploadProgress}%
            </p>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          {/* File upload button */}
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className={`p-3 rounded-xl ${
              isSending 
                ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            } transition-colors duration-200`
          }
          >
            <Image size={20} />
          </button>
          
          {/* Enhanced input container */}
          <div className="flex-1 relative">
            <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 hover:border-blue-300/50 focus-within:border-blue-500/50 shadow-lg hover:shadow-xl transition-all duration-300 px-4 py-3">
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              
              {/* Enhanced message input */}
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type your message..."
                className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-500 mx-3 font-medium"
                disabled={isSending}
              />
              
              {/* Typing indicator for current user */}
              {isTyping && (
                <div className="flex items-center space-x-1 mr-3">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced send button */}
          <button
            type="submit"
            className={`relative overflow-hidden rounded-2xl p-4 text-white font-medium shadow-lg transition-all duration-300 transform ${
              isSending || (!newMessage.trim() && !imageFile)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-105 active:scale-95"
            }`}
            disabled={isSending || (!newMessage.trim() && !imageFile)}
          >
            {/* Button background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            
            {isSending ? (
              <div className="relative w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send size={20} className="relative" />
            )}
          </button>
        </div>
        
        {/* Hidden file input - preserving functionality */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
      </form>
    </div>
  );
};

export default MessageInput;