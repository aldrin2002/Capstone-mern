import { X, Edit3, Save, Sparkles } from "lucide-react";

const EditMessageModal = ({ 
  message, 
  editedContent, 
  setEditedContent, 
  onSave, 
  onClose 
}) => {
  if (!message) return null;

  const handleSave = () => {
    onSave(message, editedContent);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20"></div>
      
      {/* Modal container with enhanced styling */}
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg p-6 border border-white/20 transform animate-modal-appear">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/50 to-purple-50/50 rounded-3xl"></div>
        
        {/* Floating background elements */}
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Edit3 size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
                  Edit Message
                </h3>
                <p className="text-sm text-gray-500">Make changes to your message</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-full transition-all duration-200 transform hover:scale-110 hover:rotate-90"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Textarea with enhanced styling */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-sm"></div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="relative w-full border-2 border-gray-200/50 rounded-2xl p-4 min-h-[120px] bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 resize-none shadow-inner placeholder-gray-400 text-gray-700"
              placeholder="✨ Edit your message..."
              autoFocus
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400 flex items-center space-x-1">
              <Sparkles size={12} />
              <span>{editedContent.length} characters</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-200/80 rounded-xl hover:bg-gray-50/80 hover:border-gray-300/80 transition-all duration-200 transform hover:scale-105 font-medium text-gray-600 backdrop-blur-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editedContent.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 font-medium shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Decorative border glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes modal-appear {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .animate-modal-appear {
          animation: modal-appear 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default EditMessageModal;