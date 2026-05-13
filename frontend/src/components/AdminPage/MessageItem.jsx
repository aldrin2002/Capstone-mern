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

  return (
    <div className={`group relative ${isAdmin ? 'ml-auto' : ''} w-fit`}>
      <div 
        className={`px-4 py-2 rounded-xl inline-block ${  // Add inline-block here
          isAdmin 
            ? 'bg-brand text-white' 
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        {/* Message attachment */}
        {message.attachment && (
          <div className="mb-2">
            <img 
              src={getImageUrl(message.attachment)}
              alt="Attachment" 
              className="rounded-lg max-h-60 max-w-full cursor-pointer"
              onClick={() => window.open(getImageUrl(message.attachment), '_blank')}
            />
          </div>
        )}

        {/* Message content */}
        <p className="break-words">{message.content}</p>
        
        {/* Message time */}
        <div className={`text-xs mt-1 ${
          isAdmin ? 'text-primary-100' : 'text-gray-500'
        }`}>
          {formatTime(message.timestamp || message.createdAt)}
        </div>
      </div>

      {/* Message actions menu */}
      {isAdmin && (
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Your existing menu button */}
        </div>
      )}
    </div>
  );
};

export default MessageItem;