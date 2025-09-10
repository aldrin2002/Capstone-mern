import React from "react";
import { User, MessageCircle, Wifi, WifiOff } from "lucide-react";

const MessageHeader = ({ adminOnlineCount, isConnected }) => {
  return (
    <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-4 shrink-0 shadow-lg backdrop-blur-xl border-b border-white/10">
      {/* Header background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Enhanced admin avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg border-2 border-white/20">
              <User size={20} className="text-white" />
            </div>
          </div>
          
          <div>
            <h1 className="text-xl font-bold">Store Owner</h1>
            <p className="text-xs text-blue-100 flex items-center">
              <MessageCircle size={12} className="mr-1" />
              {adminOnlineCount > 0 ? 'Available to chat' : 'Offline'}
            </p>
          </div>
        </div>
        
        {/* Enhanced connection status */}
        <div className="flex items-center space-x-3">
          <div className={`flex items-center px-3 py-1.5 rounded-full ${
            isConnected 
              ? 'bg-green-500/20 border border-green-400/30' 
              : 'bg-red-500/20 border border-red-400/30'
          } backdrop-blur-sm`}>
            {isConnected ? (
              <Wifi size={14} className="text-green-300 mr-1.5" />
            ) : (
              <WifiOff size={14} className="text-red-300 mr-1.5" />
            )}
            <span className="text-xs font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageHeader;