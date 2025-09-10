import { useState, useEffect } from "react";
import CustomerSideNav from "../../pages/customer/customerSideNav";
import { useAuthStore } from "../../store/authStore";
import { ChevronDown } from "lucide-react";
import { toast } from "react-hot-toast";
import { useCustomerMessages } from "../../context/CustomerMessageContext";
import { useMessageState } from "./CustomerMessage/useMessageState";
import { useScrollBehavior } from "./CustomerMessage/useScrollBehavior";
import MessageHeader from "./CustomerMessage/MessageHeader";
import MessageList from "./CustomerMessage/MessageList";
import MessageInput from "./CustomerMessage/MessageInput";
import "./CustomerMessage/messageStyles.css";
import { audioService } from "../../utils/audioService"; // Add this import

// API URLs
const API_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
const API_URL = `${API_BASE_URL}/api/messages`;

const CustomerMessage = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { user } = useAuthStore();
  
  // Use the global context
  const { 
    socket, 
    isConnected, 
    adminOnlineCount, 
    isAdminTyping,
    setMessagesPageActive,
    resetUnreadCount
  } = useCustomerMessages();
  
  // Custom hooks
  const {
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    conversation,
    isTyping,
    imageFile,
    imagePreview,
    fileInputRef,
    handleTyping,
    handleSendMessage,
    handleFileChange,
    uploadProgress
  } = useMessageState(API_URL, API_BASE_URL, socket);
  
  const {
    messagesEndRef,
    messagesContainerRef,
    showScrollButton,
    scrollToBottom
  } = useScrollBehavior(messages);
  
  // Initialize audio immediately when component mounts
  useEffect(() => {
    // Initialize audio system right away
    console.log("🔊 Auto-initializing audio system on component mount");
    
    // Try a few different methods to ensure audio gets initialized:
    
    // Method 1: Direct initialization
    audioService.initialize();
    
    // Method 2: Create and play a silent sound to unlock audio
    const unlockAudio = () => {
      const silentSound = new Audio("data:audio/mp3;base64,SUQzBAAAAAABEUgAEgAAABgAIAAAACQAUABMAEUAQQAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAABAAADQgD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAAA5TEFNRTMuMTAwAc0AAAAAAAAAABRAJAJAQgAAgAAAA0L2S4LKAAAAAAD/+xDEAAPAAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABExBTUUzLjEwMC4zVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
      silentSound.volume = 0.01;
      silentSound.play().then(() => {
        silentSound.pause();
        silentSound.remove();
        console.log("🔊 Audio system unlocked with silent sound");
      }).catch(e => console.log("Audio unlock attempt:", e.message));
    };
    
    // Try to unlock audio after a short delay
    setTimeout(unlockAudio, 500);
    
    // Method 3: Create hidden audio element in DOM
    const audioEl = document.createElement('audio');
    audioEl.id = 'audio-initializer';
    audioEl.src = '/notification-subtle.mp3';
    audioEl.preload = 'auto';
    audioEl.volume = 0;
    document.body.appendChild(audioEl);
    
    // Click handler to initialize on first user action
    const initializeAudioOnClick = () => {
      console.log("🔊 Initializing audio from click");
      audioService.initialize();
      audioEl.play().then(() => {
        audioEl.pause();
        audioEl.currentTime = 0;
        console.log("🔊 Audio initialized from click");
      }).catch(e => console.log("Click audio init failed:", e));
      document.removeEventListener('click', initializeAudioOnClick);
    };
    
    document.addEventListener('click', initializeAudioOnClick);
    
    // Clean up
    return () => {
      document.removeEventListener('click', initializeAudioOnClick);
      if (document.getElementById('audio-initializer')) {
        document.getElementById('audio-initializer').remove();
      }
    };
  }, []);
  
  // Handle messages page activation
  useEffect(() => {
    console.log("📱 CustomerMessage component mounted - setting messages page active");
    setMessagesPageActive(true);
    
    // Force reset of unread counter
    resetUnreadCount();
    
    return () => {
      console.log("📱 CustomerMessage component unmounted - setting messages page inactive");
      setMessagesPageActive(false);
    };
  }, [setMessagesPageActive, resetUnreadCount]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Invisible button to help initialize audio immediately */}
      <button 
        className="sr-only"
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        onClick={() => {
          console.log("🔊 Initializing audio from hidden button");
          audioService.initialize();
        }}
        aria-hidden="true"
      >Initialize Audio</button>

      {/* Sidebar */}
      <CustomerSideNav />

      {/* Main Content - Adjusted for fixed sidebar */}
      <main className={`h-screen flex flex-col overflow-hidden relative ${isMobile ? '' : 'ml-64'}`}>
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
        
        {/* Header */}
        <MessageHeader 
          adminOnlineCount={adminOnlineCount}
          isConnected={isConnected}
        />

        {/* Messages Container */}
        <MessageList 
          messages={messages}
          isLoading={isLoading}
          messagesContainerRef={messagesContainerRef}
          messagesEndRef={messagesEndRef}
          isAdminTyping={isAdminTyping}
          API_BASE_URL={API_BASE_URL}
          isMobile={isMobile}
        />
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-32 md:bottom-28 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 z-20 border border-white/20 backdrop-blur-sm"
          >
            <ChevronDown size={20} />
          </button>
        )}

        {/* Input Area */}
        <MessageInput 
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleTyping={handleTyping}
          handleSendMessage={handleSendMessage}
          handleFileChange={handleFileChange}
          fileInputRef={fileInputRef}
          isMobile={isMobile}
          isTyping={isTyping}
          isSending={isSending}
          imageFile={imageFile}
          imagePreview={imagePreview}
          uploadProgress={uploadProgress} // Now this will be properly defined
        />
      </main>
    </div>
  );
};

export default CustomerMessage;