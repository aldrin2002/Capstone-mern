import { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit, Trash2, User, CircleCheck } from "lucide-react";

const MessageItem = ({ 
  message, 
  isAdmin, 
  onDelete, 
  onEdit, 
  formatTime, 
  API_BASE_URL,
  isDeleting 
}) => {
  const [activeMenu, setActiveMenu] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setActiveMenu(!activeMenu);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(message);
    setActiveMenu(false);
  };

  const handleDelete = (e) => {
    onDelete(message._id, e);
    setActiveMenu(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setActiveMenu(false);
      }
    };

    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeMenu]);

  return (
    <div
      className={`rounded-2xl px-5 py-3 relative group transition-all duration-300 transform hover:scale-[1.02] ${
        isAdmin 
          ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white rounded-tr-none shadow-lg hover:shadow-xl border border-blue-400/20' 
          : 'bg-gradient-to-br from-white to-gray-50/50 text-gray-800 rounded-tl-none border border-gray-200/50 shadow-md hover:shadow-lg backdrop-blur-sm'
      }`}
    >
      {/* Subtle background overlay */}
      <div className={`absolute inset-0 rounded-2xl pointer-events-none ${
        isAdmin 
          ? 'bg-gradient-to-br from-white/10 to-transparent' 
          : 'bg-gradient-to-br from-blue-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'
      }`}></div>

      {/* Message attachment with enhanced styling */}
      {message.attachment && (
        <div className="mb-3 relative overflow-hidden rounded-xl">
          <img 
            src={message.attachment.startsWith('data:') 
              ? message.attachment 
              : `${API_BASE_URL}${message.attachment}`
            } 
            alt="Attachment" 
            className="rounded-xl max-h-60 max-w-full cursor-pointer hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg"
            onClick={() => window.open(
              message.attachment.startsWith('data:') 
                ? message.attachment 
                : `${API_BASE_URL}${message.attachment}`, 
              '_blank'
            )}
          />
          {/* Image overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
        </div>
      )}
      
      {/* Message content with better typography */}
      <p className={`whitespace-pre-wrap relative z-10 ${
        isAdmin 
          ? 'text-white font-medium leading-relaxed' 
          : 'text-gray-800 font-medium leading-relaxed'
      }`}>
        {message.content}
      </p>
      
      {/* Enhanced timestamp and read status */}
      <div className={`flex items-center justify-end text-xs mt-2 opacity-80 relative z-10 ${
        isAdmin ? 'text-blue-100' : 'text-gray-500'
      }`}>
        <span className="font-medium">{formatTime(message.timestamp || message.createdAt)}</span>
        {isAdmin && (
          <CircleCheck 
            size={14} 
            className={`ml-2 transition-colors duration-300 ${
              message.isRead 
                ? 'text-green-200 animate-pulse' 
                : 'text-blue-200'
            }`}
          />
        )}
      </div>
      
      {/* Enhanced message options button with better visibility */}
      <button
        ref={buttonRef}
        className={`absolute -top-2 ${isAdmin ? '-right-2' : '-left-2'} w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full transform hover:scale-110 shadow-lg z-30 ${
          activeMenu 
            ? (isAdmin 
                ? 'bg-blue-600 text-white opacity-100 shadow-xl ring-2 ring-blue-300/50' 
                : 'bg-gray-600 text-white opacity-100 shadow-xl ring-2 ring-gray-300/50'
              )
            : (isAdmin 
                ? 'bg-white/90 text-blue-600 hover:bg-white hover:text-blue-700 backdrop-blur-sm' 
                : 'bg-gray-800/90 text-white hover:bg-gray-800 backdrop-blur-sm'
              )
        }`}
        onClick={handleMenuClick}
        disabled={isDeleting}
        title="Message options"
      >
        <MoreVertical size={14} className={`transition-transform duration-200 ${activeMenu ? 'rotate-90' : ''}`} />
      </button>

      {/* Completely redesigned message options menu */}
      {activeMenu && (
        <>
          {/* Backdrop overlay */}
          <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40" onClick={() => setActiveMenu(false)} />
          
          {/* Enhanced menu with better positioning */}
          <div 
            ref={menuRef}
            className={`absolute ${isAdmin ? 'right-0 top-8' : 'left-0 top-8'} bg-white/98 backdrop-blur-xl shadow-2xl rounded-2xl py-3 w-48 z-50 border border-gray-200/50 animate-slide-in`}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Menu header */}
            <div className="px-4 py-2 border-b border-gray-100/80">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message Options</p>
            </div>

            {/* Edit option */}
            {isAdmin && message.content && (
              <button
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 flex items-center transition-all duration-200 font-medium group/item"
                onClick={handleEdit}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3 group-hover/item:bg-blue-200 transition-colors">
                  <Edit size={14} className="text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Edit message</div>
                  <div className="text-xs text-gray-500">Modify the content</div>
                </div>
              </button>
            )}

            {/* Delete option */}
            <button
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 flex items-center transition-all duration-200 font-medium group/item"
              onClick={handleDelete}
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center mr-3 group-hover/item:bg-red-200 transition-colors">
                <Trash2 size={14} className="text-red-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Delete message</div>
                <div className="text-xs text-gray-500">Remove permanently</div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Message bubble tail with gradient */}
      <div className={`absolute top-0 ${
        isAdmin 
          ? 'right-0 w-0 h-0 border-l-[12px] border-l-transparent border-b-[12px] border-b-blue-500' 
          : 'left-0 w-0 h-0 border-r-[12px] border-r-transparent border-b-[12px] border-b-gray-200'
      }`}></div>

      {/* Subtle glow effect */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
        isAdmin 
          ? 'bg-gradient-to-br from-blue-400/20 to-purple-600/20 blur-sm' 
          : 'bg-gradient-to-br from-blue-400/10 to-indigo-400/10 blur-sm'
      }`}></div>

      {/* Enhanced animations */}
      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-15px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Custom scrollbar for menu if needed */
        .menu-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .menu-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .menu-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.4);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default MessageItem;