import { Trash2, MessageCircle, Clock } from "lucide-react";

const ConversationItem = ({ 
  conversation, 
  isSelected, 
  isOnline, 
  onSelect, 
  onDelete, 
  formatTime,
  isMobile 
}) => {
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(conversation._id, e);
  };

  return (
    <div
      className={`relative p-4 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] group rounded-2xl mx-2 mb-3 overflow-hidden
        ${isSelected 
          ? 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border-2 border-blue-500/30 shadow-xl backdrop-blur-sm' 
          : 'bg-white/80 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 border border-white/50 hover:border-blue-200/50 shadow-lg hover:shadow-xl backdrop-blur-sm'
        }
        ${conversation.unreadCount > 0 && !isSelected ? 'ring-2 ring-amber-300/50 bg-gradient-to-r from-amber-50/90 to-yellow-50/90 animate-pulse' : ''}
      `}
    >
      {/* Subtle background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none opacity-50"></div>
      
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full shadow-lg"></div>
      )}

      {/* Main conversation content */}
      <div 
        className="flex items-center space-x-4 relative z-10"
        onClick={() => onSelect(conversation)}
      >
        <div className="relative flex-shrink-0">
          {/* Avatar with enhanced styling */}
          <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg transition-all duration-300 transform group-hover:scale-110
            ${isSelected 
              ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-blue-500/30' 
              : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white group-hover:from-blue-500 group-hover:to-purple-600'
            }`}>
            {conversation.customer?.name?.charAt(0).toUpperCase() || 'C'}
          </div>
          
          {/* Online status indicator with glow effect */}
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-3 border-white shadow-lg animate-pulse">
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
            </div>
          )}
          
          {/* Message count bubble */}
          {conversation.unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <span className="text-xs text-white font-bold px-1">
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className={`font-semibold text-sm truncate transition-colors duration-200
              ${isSelected 
                ? 'text-blue-800' 
                : 'text-gray-800 group-hover:text-blue-700'
              }`}>
              {conversation.customer?.name || 'Customer'}
            </p>
            <div className="flex items-center space-x-1">
              <Clock size={12} className={`${isSelected ? 'text-blue-600' : 'text-gray-400'} transition-colors duration-200`} />
              <span className={`text-xs font-medium
                ${isSelected 
                  ? 'text-blue-600' 
                  : 'text-gray-500 group-hover:text-blue-600'
                } transition-colors duration-200`}>
                {formatTime(conversation.lastMessage || conversation.createdAt)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <MessageCircle size={12} className={`${isSelected ? 'text-blue-500' : 'text-gray-400'} transition-colors duration-200`} />
            <p className={`text-xs truncate
              ${isSelected 
                ? 'text-blue-700' 
                : 'text-gray-600 group-hover:text-gray-700'
              } transition-colors duration-200`}>
              {conversation.lastMessageContent || 'No messages yet'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Enhanced delete button */}
      <button
        className={`absolute transition-all duration-300 transform hover:scale-110 z-20
          ${isMobile 
            ? 'right-3 top-1/2 -translate-y-1/2 p-2.5 bg-red-100/90 backdrop-blur-sm border border-red-200/50 shadow-lg' 
            : 'top-3 right-3 p-2 bg-red-50/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 border border-red-200/50 shadow-md'
          }
          rounded-full text-red-500 hover:bg-red-100 hover:text-red-600 hover:shadow-lg hover:border-red-300/50`}
        onClick={handleDelete}
        aria-label="Delete conversation"
      >
        <Trash2 size={isMobile ? 16 : 14} className="drop-shadow-sm" />
      </button>

      {/* Subtle hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      
      {/* Selected conversation glow */}
      {isSelected && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
};

export default ConversationItem;