import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
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
  const navigate = useNavigate();
  const location = useLocation();
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
    setConversation,
    isTyping,
    imageFile,
    imagePreview,
    fileInputRef,
    handleTyping,
    handleSendMessage,
    handleFileChange,
    handleRemoveImage,
    uploadProgress
  } = useMessageState(API_URL, API_BASE_URL, socket);

  // Order-linked conversation (single latest active)
  const [loadingOrderConversation, setLoadingOrderConversation] = useState(false);
  const [activeOrderConversation, setActiveOrderConversation] = useState(null); // conversation object with order populated
  const [orderThreadConversations, setOrderThreadConversations] = useState([]);
  const [selectedThreadType, setSelectedThreadType] = useState("admin");
  const [summaryProduct, setSummaryProduct] = useState(null);

  // Load owner/driver conversations and pick target via URL query
  useEffect(() => {
    const loadConversations = async () => {
      if (!socket) return;

      const params = new URLSearchParams(location.search);
      const targetOrderId = params.get("orderId");
      const requestedThread = params.get("thread") === "driver" ? "driver" : "admin";

      setLoadingOrderConversation(true);
      try {
        // Ensure requested conversation exists when opened from My Orders buttons
        if (targetOrderId) {
          await axios.get(`${API_URL}/conversation/order/${targetOrderId}`, { withCredentials: true });
          if (requestedThread === "driver") {
            try {
              await axios.get(`${API_URL}/conversation/order/${targetOrderId}/driver`, { withCredentials: true });
            } catch (driverErr) {
              console.log("Driver conversation not ready yet:", driverErr.response?.data?.message || driverErr.message);
            }
          }
        }

        const res = await axios.get(`${API_URL}/conversations/active-orders`, { withCredentials: true });
        const list = res.data || [];

        let selected = null;
        let availableThreads = [];

        if (targetOrderId) {
          availableThreads = list.filter((c) => c.order?._id?.toString() === targetOrderId);
          selected = availableThreads.find((c) => (c.threadType || "admin") === requestedThread) || availableThreads[0] || null;
        } else if (list.length > 0) {
          selected = list[0];
          availableThreads = list.filter((c) => c.order?._id?.toString() === selected.order?._id?.toString());
        }

        if (selected) {
          setActiveOrderConversation(selected);
          setConversation(selected);
          setOrderThreadConversations(availableThreads);
          setSelectedThreadType(selected.threadType || "admin");
          return;
        }

        setActiveOrderConversation(null);
        setOrderThreadConversations([]);
        // Fallback to general conversation so messaging still works
        const generalRes = await axios.get(`${API_URL}/conversation`, { withCredentials: true });
        if (generalRes.data) {
          setConversation(generalRes.data);
          setSelectedThreadType("admin");
        }
      } catch (err) {
        console.error("Failed loading conversations", err.message);
      } finally {
        setLoadingOrderConversation(false);
      }
    };

    loadConversations();
  }, [socket, API_URL, setConversation, location.search]);

  // (Removed synthetic summary message injection per request to restore header summary)

  // Fetch first product details (for image/name) for summary
  useEffect(() => {
    const loadFirstProduct = async () => {
      try {
        setSummaryProduct(null);
        const order = activeOrderConversation?.order;
        const firstItem = order?.items?.[0];
        if (firstItem?.product) {
          const res = await axios.get(`${API_BASE_URL}/api/products/${firstItem.product}`);
          setSummaryProduct(res.data);
        }
      } catch (e) {
        console.log("Failed to load product for summary", e.message);
      }
    };
    loadFirstProduct();
  }, [activeOrderConversation]);

  const switchThread = (threadType) => {
    const target = orderThreadConversations.find((c) => (c.threadType || "admin") === threadType);
    if (!target) return;

    setSelectedThreadType(threadType);
    setActiveOrderConversation(target);
    setConversation(target);

    const orderId = target.order?._id;
    if (orderId) {
      navigate(`/customer-message?orderId=${orderId}&thread=${threadType}`, { replace: true });
    }
  };

  const activePartnerLabel = selectedThreadType === "driver"
    ? (activeOrderConversation?.driver?.name ? `Driver: ${activeOrderConversation.driver.name}` : "Assigned Driver")
    : "Store Owner";

  const activePartnerStatus = selectedThreadType === "driver"
    ? "Direct delivery chat"
    : (adminOnlineCount > 0 ? "Available to chat" : "Offline");
  
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

  // Listen for real-time order updates (status or details)
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (payload) => {
      if (!activeOrderConversation?.order) return; 
      if (payload.orderId?.toString() !== activeOrderConversation.order._id?.toString()) return;
      // Update status and other fields
      setActiveOrderConversation(prev => prev ? { ...prev, order: payload.order || { ...prev.order, status: payload.status } } : prev);
      setOrderThreadConversations(prev => prev.map((c) =>
        c.order?._id?.toString() === payload.orderId?.toString()
          ? { ...c, order: payload.order || { ...c.order, status: payload.status } }
          : c
      ));
      // If order completed or cancelled, fallback to general conversation
      if (["Completed", "Cancelled"].includes(payload.status)) {
        setActiveOrderConversation(null);
        setOrderThreadConversations([]);
        // Load / create general conversation
        axios.get(`${API_URL}/conversation`, { withCredentials: true })
          .then(r => setConversation(r.data))
          .catch(e => console.error("Failed to load general conversation after completion", e.message));
      }
    };

    const handleOrderUpdated = ({ order }) => {
      if (!order || !activeOrderConversation?.order) return;
      if (order._id?.toString() !== activeOrderConversation.order._id?.toString()) return;
      setActiveOrderConversation(prev => prev ? { ...prev, order } : prev);
      setOrderThreadConversations(prev => prev.map((c) =>
        c.order?._id?.toString() === order._id?.toString()
          ? { ...c, order }
          : c
      ));
    };

    socket.on('order-status-updated', handleStatusUpdate);
    socket.on('order-updated', handleOrderUpdated);

    return () => {
      socket.off('order-status-updated', handleStatusUpdate);
      socket.off('order-updated', handleOrderUpdated);
    };
  }, [socket, activeOrderConversation, API_URL]);

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

      {/* Main Content - Adjusted for fixed sidebar and mobile nav */}
      <main className={`h-screen flex flex-col relative ${
        isMobile ? 'pb-16' : 'ml-64' // Add bottom padding for mobile nav
      }`}>
        {/* Removed full-screen overlay to prevent gradient cut/flicker during scroll */}
        
        {/* Status / info line integrated into summary block below - gap removed */}

        {/* Header */}
        <MessageHeader
          adminOnlineCount={adminOnlineCount}
          isConnected={isConnected}
          partnerLabel={activePartnerLabel}
          partnerStatus={activePartnerStatus}
        />

        {activeOrderConversation?.order && (
          <div className="px-4 py-2 bg-white border-b border-gray-200 flex flex-wrap gap-2">
            <button
              onClick={() => switchThread("admin")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                selectedThreadType === "admin"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              }`}
            >
              Store Owner
            </button>
            <button
              onClick={() => switchThread("driver")}
              disabled={!orderThreadConversations.some((c) => (c.threadType || "admin") === "driver")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                selectedThreadType === "driver"
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Driver
            </button>
          </div>
        )}
        {/* Order Summary Header (restored) */}
        {activeOrderConversation?.order && (
          <div className="sticky top-0 z-20 px-4 py-3 bg-white/95 backdrop-blur-md shadow border-b border-gray-200">
            {(() => {
              const order = activeOrderConversation.order;
              const itemsCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
              const firstName = order.items?.[0]?.name || "Item";
              const extraCount = Math.max(0, (order.items?.length || 0) - 1);
              const productLabel = extraCount > 0 ? `${firstName} +${extraCount} more` : firstName;
              const imageSrc = summaryProduct?.image ||
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23eef2ff"/><path d="M10 60 L30 40 L45 55 L60 35 L70 60 Z" fill="%2393c5fd"/><circle cx="28" cy="28" r="8" fill="%2373a6f5"/></svg>';
              const statusColorMap = {
                Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                'Preparing Food': 'bg-indigo-100 text-indigo-800 border-indigo-300',
                'Ready for Delivery': 'bg-cyan-100 text-cyan-800 border-cyan-300',
                Processing: 'bg-blue-100 text-blue-800 border-blue-300',
                Delivered: 'bg-purple-100 text-purple-800 border-purple-300',
                Completed: 'bg-green-100 text-green-800 border-green-300',
                Cancelled: 'bg-red-100 text-red-800 border-red-300'
              };
              const statusClasses = statusColorMap[order.status] || 'bg-gray-100 text-gray-800 border-gray-300';
              return (
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                      <img src={imageSrc} alt={firstName} className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute -bottom-2 left-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white shadow select-none">{itemsCount} item{itemsCount!==1?'s':''}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold tracking-wide text-gray-600 uppercase">Order Details</div>
                      <button
                        onClick={() => navigate('/customer-orders')}
                        className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 transition"
                        aria-label="View all orders"
                      >
                        <span>View Orders</span>
                      </button>
                    </div>
                    <div className="mt-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-1 text-[12px] leading-tight">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-gray-800 truncate">#{order._id.toString().slice(-8)}</span>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusClasses}`}>{order.status}</span>
                      </div>
                      <div className="text-gray-700 truncate" title={productLabel}>Product: {productLabel}</div>
                      <div className="text-gray-700">Total: ₱{order.total?.toFixed(2)}</div>
                      <div className="text-gray-700">Delivery: ₱{order.deliveryFee?.toFixed(2)}</div>
                      <div className="text-gray-700">Driver: {order.driverAssigned?.name || 'Unassigned'}</div>
                      <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 flex items-center gap-2 mt-1">
                        <span className="text-gray-600">To:</span>
                        <span className="truncate text-gray-800" title={order.deliveryAddress}>{order.deliveryAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            {loadingOrderConversation && <div className="text-[11px] text-gray-500 mt-2">Loading...</div>}
          </div>
        )}
        {!loadingOrderConversation && !activeOrderConversation && (
          <div className="px-4 py-3 bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 text-[11px] text-gray-600">
            General chat active. Place an order to open an order-specific thread.
          </div>
        )}

        {/* Messages Container - solid white background to prevent color cut issues */}
        <div className="flex-1 bg-white">
          <MessageList 
            messages={messages}
            isLoading={isLoading}
            messagesContainerRef={messagesContainerRef}
            messagesEndRef={messagesEndRef}
            isAdminTyping={isAdminTyping}
            API_BASE_URL={API_BASE_URL}
            isMobile={isMobile}
          />
        </div>
        
        {/* Scroll to bottom button - Adjust position for mobile */}
        {/* Scroll button removed per user request */}

        {/* Input Area - Fixed for both desktop and mobile */}
        <div className={isMobile ? 'fixed bottom-16 left-0 right-0 z-30' : 'fixed bottom-0 left-64 right-0 z-30'}>
          <MessageInput 
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleTyping={handleTyping}
            handleSendMessage={handleSendMessage}
            handleFileChange={handleFileChange}
            handleRemoveImage={handleRemoveImage}
            fileInputRef={fileInputRef}
            isMobile={isMobile}
            isTyping={isTyping}
            isSending={isSending}
            imageFile={imageFile}
            imagePreview={imagePreview}
            uploadProgress={uploadProgress}
          />
        </div>
      </main>
    </div>
  );
};

export default CustomerMessage;