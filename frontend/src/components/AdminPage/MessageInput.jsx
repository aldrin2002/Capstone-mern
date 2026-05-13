import { Send, Image, Loader, Sparkles } from "lucide-react";
import { useRef } from "react";
import { audioService } from "../../utils/audioService";

const MessageInput = ({ 
  newMessage, 
  setNewMessage, 
  onSubmit, 
  onTyping, 
  isSending, 
  attachment,
  onFileChange,
  isMobile,
  hideAttachmentButton = false
}) => {
  const fileInputRef = useRef(null);

  const handleSendWithSound = (e) => {
    onSubmit(e);
    
    // No need to play sound here as it's handled in the onSubmit function
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    onTyping();
  };

  return (
    <div className="bg-white p-4">
      {/* Attachment preview */}
      {attachment && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-brand rounded-lg">
                <Image size={16} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">Image attached</span>
            </div>
            <button
              onClick={() => onFileChange({ target: { files: [] } })}
              className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
            >
              ×
            </button>
          </div>
          
          <div className="mt-2">
            <img 
              src={attachment} 
              alt="Preview" 
              className="h-20 rounded-lg border border-gray-200"
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSendWithSound} className="flex items-center space-x-3">
        {/* Input container */}
        <div className="flex-1 bg-gray-100 rounded-lg flex items-center px-4 py-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 bg-transparent outline-none text-sm placeholder-gray-500"
          />
          
          {/* File upload button */}
          {!hideAttachmentButton && (
            <>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="ml-2 p-2 text-gray-400 hover:text-brand rounded-lg"
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
            </>
          )}
        </div>

        {/* Send button */}
        <button 
          type="submit" 
          className={`p-3 rounded-lg text-white flex items-center justify-center ${
            isSending || (!newMessage.trim() && !attachment)
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-brand hover:bg-primary-700'
          }`}
          disabled={isSending || (!newMessage.trim() && !attachment)}
        >
          {isSending ? (
            <Loader className="h-5 w-5 animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;