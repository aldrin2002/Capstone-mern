import { Send, Image, Loader, Sparkles } from "lucide-react";
import { useRef } from "react";

const MessageInput = ({ 
  newMessage, 
  setNewMessage, 
  onSubmit, 
  onTyping, 
  isSending, 
  attachment,
  onFileChange,
  isMobile 
}) => {
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    onTyping();
  };

  return (
    <div className={`bg-gradient-to-r from-white/90 via-blue-50/80 to-white/90 backdrop-blur-xl border-t border-white/30 p-4 shadow-2xl ${
      isMobile ? 'fixed bottom-16 left-0 right-0 border-t-2 border-blue-200/50' : 'sticky bottom-0'
    }`}>
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 pointer-events-none"></div>
      
      {/* Attachment preview */}
      {attachment && (
        <div className="mb-3 p-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-200/30 shadow-lg animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md">
              <Image size={16} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">Image attached</span>
            <div className="flex-1"></div>
            <button
              onClick={() => onFileChange({ target: { files: [] } })}
              className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-all duration-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center space-x-3 max-w-4xl mx-auto relative">
        {/* Input container with enhanced styling */}
        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center px-5 py-3 border-2 border-white/50 hover:border-blue-300/50 focus-within:border-blue-500/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="✨ Type your message..."
              className="flex-1 bg-transparent outline-none text-sm placeholder-gray-500 text-gray-700 font-medium"
            />
            
            {/* Typing indicator */}
            {newMessage && (
              <div className="flex items-center space-x-1 ml-2 text-blue-500 animate-pulse">
                <Sparkles size={12} />
              </div>
            )}
          </div>

          {/* File upload button */}
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="ml-3 p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50/80 rounded-xl transition-all duration-200 transform hover:scale-110 group-hover:rotate-12"
            title="Attach image"
          >
            <Image size={18} />
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
        </div>

        {/* Enhanced send button */}
        <button 
          type="submit" 
          className={`p-3 rounded-2xl text-white shadow-lg transition-all duration-300 transform hover:scale-110 flex items-center justify-center min-w-[48px] min-h-[48px]
            ${isSending || (!newMessage.trim() && !attachment)
              ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed opacity-60' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl shadow-blue-500/25'
            }`}
          disabled={isSending || (!newMessage.trim() && !attachment)}
          title={isSending ? 'Sending...' : 'Send message'}
        >
          {isSending ? (
            <div className="relative">
              <Loader className="h-5 w-5 animate-spin" />
              <div className="absolute inset-0 h-5 w-5 border-2 border-white/30 rounded-full animate-ping"></div>
            </div>
          ) : (
            <Send size={18} className="transform group-hover:translate-x-0.5 transition-transform duration-200" />
          )}
        </button>
      </form>

      {/* Floating decorative elements */}
      <div className="absolute top-2 left-6 w-2 h-2 bg-blue-400/30 rounded-full animate-pulse"></div>
      <div className="absolute top-4 right-8 w-1 h-1 bg-purple-400/40 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute bottom-2 left-1/3 w-1.5 h-1.5 bg-indigo-400/20 rounded-full animate-pulse delay-500"></div>

      {/* Custom styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default MessageInput;