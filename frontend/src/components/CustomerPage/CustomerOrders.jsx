import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import CustomerSideNav from "../../pages/customer/customerSideNav";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingBag, 
  Truck, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Package, 
  Coffee,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Sparkles,
  CreditCard,
  MapPin,
  Calendar,
  Filter,
  X, // ✅ Added for modal close button
  MessageSquare, // ✅ Added for feedback icon
  MessageCircle
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useCustomerMessages } from "../../context/CustomerMessageContext";

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [statusFilter, setStatusFilter] = useState("All");
  
  // ✅ NEW: Rating Modal States
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const { socket, isConnected } = useCustomerMessages();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleOrderStatusUpdate = (data) => {
      console.log("📦 Order status update received:", data);
      
      const orderBelongsToUser = orders.some(order => order._id === data.orderId);
      
      if (!orderBelongsToUser) {
        console.log("📦 Ignoring order update - not for this customer");
        return;
      }
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === data.orderId 
            ? { ...order, status: data.status, updatedAt: data.updatedAt }
            : order
        )
      );

      toast.success(
        <div className="flex flex-col">
          <div className="font-bold flex items-center">
            <span className="bg-blue-500 rounded-full w-2 h-2 mr-2 animate-pulse"></span>
            Order Status Updated!
          </div>
          <div className="text-sm mt-1">Order #{data.orderId.slice(-6)} is now {data.status}</div>
        </div>,
        {
          duration: 5000,
          style: {
            borderLeft: "4px solid #3B82F6",
            background: "linear-gradient(135deg, #EBF8FF 0%, #DBEAFE 100%)",
          },
        }
      );
    };

    socket.on('order-status-updated', handleOrderStatusUpdate);

    return () => {
      socket.off('order-status-updated', handleOrderStatusUpdate);
    };
  }, [socket, isConnected, orders]);

  useEffect(() => {
    if (!user) {
      toast.error("Please log in to view your orders");
      navigate("/costumerLogin");
      return;
    }

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const apiUrl = import.meta.env.MODE === "development" 
          ? "http://localhost:5000/api/orders/customer" 
          : "/api/orders/customer";
        
        const token = localStorage.getItem('token');
        const headers = {};
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        const response = await axios.get(`${apiUrl}?email=${encodeURIComponent(user.email)}`, { 
          withCredentials: true,
          headers
        });
        
        const sortedOrders = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        if (error.response?.status === 401) {
          toast.error("Session expired. Please log in again.");
          navigate("/costumerLogin");
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Could not load your orders");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(prevExpanded => prevExpanded === orderId ? null : orderId);
  };

  // ✅ NEW: Open Rating Modal
  const openRatingModal = (order) => {
    setSelectedOrderForRating(order);
    setRating(order.rating || 0);
    setFeedback(order.feedback || "");
    setShowRatingModal(true);
  };

  // ✅ NEW: Close Rating Modal
  const closeRatingModal = () => {
    setShowRatingModal(false);
    setSelectedOrderForRating(null);
    setRating(0);
    setHoveredRating(0);
    setFeedback("");
  };

  // ✅ NEW: Submit Rating
  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!feedback.trim()) {
      toast.error("Please provide your feedback");
      return;
    }

    setIsSubmittingRating(true);
    
    try {
      const apiUrl = import.meta.env.MODE === "development" 
        ? `http://localhost:5000/api/orders/${selectedOrderForRating._id}/rating` 
        : `/api/orders/${selectedOrderForRating._id}/rating`;
      
      const token = localStorage.getItem('token');
      const headers = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      await axios.post(
        apiUrl,
        {
          rating,
          feedback
        },
        {
          withCredentials: true,
          headers
        }
      );

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === selectedOrderForRating._id
            ? { ...order, rating, feedback, hasRated: true }
            : order
        )
      );

      toast.success("Thank you for your feedback! 🌟");
      closeRatingModal();
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error(error.response?.data?.message || "Failed to submit rating");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return {
          bg: "bg-gradient-to-r from-yellow-100 to-orange-100",
          text: "text-yellow-800",
          icon: <Clock className="h-4 w-4" />,
          border: "border-yellow-300"
        };
      case "Preparing Food":
        return {
          bg: "bg-gradient-to-r from-indigo-100 to-blue-100",
          text: "text-indigo-800",
          icon: <Package className="h-4 w-4" />,
          border: "border-indigo-300"
        };
      case "Ready for Delivery":
        return {
          bg: "bg-gradient-to-r from-cyan-100 to-teal-100",
          text: "text-cyan-800",
          icon: <Truck className="h-4 w-4" />,
          border: "border-cyan-300"
        };
      case "Processing":
        return {
          bg: "bg-gradient-to-r from-blue-100 to-indigo-100",
          text: "text-blue-800",
          icon: <Package className="h-4 w-4" />,
          border: "border-blue-300"
        };
      case "Delivered":
        return {
          bg: "bg-gradient-to-r from-purple-100 to-pink-100",
          text: "text-purple-800",
          icon: <Truck className="h-4 w-4" />,
          border: "border-purple-300"
        };
      case "Completed":
        return {
          bg: "bg-gradient-to-r from-green-100 to-emerald-100",
          text: "text-green-800",
          icon: <CheckCircle className="h-4 w-4" />,
          border: "border-green-300"
        };
      case "Cancelled":
        return {
          bg: "bg-gradient-to-r from-red-100 to-pink-100",
          text: "text-red-800",
          icon: <XCircle className="h-4 w-4" />,
          border: "border-red-300"
        };
      default:
        return {
          bg: "bg-gradient-to-r from-gray-100 to-gray-200",
          text: "text-gray-800",
          icon: <AlertCircle className="h-4 w-4" />,
          border: "border-gray-300"
        };
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } catch (error) {
      return "Date unavailable";
    }
  };

  const getProductInfo = (item) => {
    if (!item || !item.product) {
      return {
        name: "Product no longer available",
        image: null,
        isDeleted: true
      };
    }
    return {
      name: item.product.name,
      image: item.product.image,
      isDeleted: false
    };
  };

  const filteredOrders = orders.filter(order => {
    return statusFilter === "All" || order.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <CustomerSideNav />

      <main className={`${isMobile ? 'pb-20' : 'ml-64'}`}>
        <div className="container mx-auto px-4 py-6 space-y-6">
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            
            <div className="absolute top-8 right-8 w-20 h-20 border-2 border-white/20 rounded-full animate-spin-slow"></div>
            <div className="absolute bottom-8 left-8 w-16 h-16 border border-white/10 rounded-full animate-pulse"></div>
            
            <div className="relative px-6 py-8 md:py-12">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-4">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Order Management
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    My Orders
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Track and manage your cafe orders
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-2xl border-4 border-white/20">
                      <Package className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <Star size={16} className="text-white" fill="currentColor" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 appearance-none bg-white"
                >
                  <option value="All">All Orders</option>
                  <option value="Pending">Pending</option>
                  <option value="Preparing Food">Preparing Food</option>
                  <option value="Ready for Delivery">Ready for Delivery</option>
                  <option value="Processing">Processing</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="relative mb-8">
                  <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto shadow-lg"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Package className="h-8 w-8 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Loading Your Orders</h3>
                <p className="text-gray-600 text-lg">Fetching your order history...</p>
                <div className="flex justify-center space-x-1 mt-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto shadow-2xl border-4 border-white">
                  <ShoppingBag className="h-14 w-14 text-gray-400" />
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-xl animate-bounce">
                  <Sparkles size={24} className="text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-blue-600 bg-clip-text text-transparent mb-4">
                {orders.length === 0 ? "No orders yet" : "No matching orders"}
              </h2>
              <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                {orders.length === 0 
                  ? "You haven't placed any orders yet. Start exploring our delicious menu!" 
                  : "Try adjusting your filter to find the orders you're looking for."
                }
              </p>
              {orders.length === 0 && (
                <button 
                  onClick={() => navigate('/customer-buy')}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium"
                >
                  <Coffee className="h-5 w-5 mr-2" />
                  Start Shopping
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrder === order._id;
                const statusStyle = getStatusStyle(order.status);
                
                return (
                  <div key={order._id} className="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                    <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500 flex items-center">
                            <Package className="h-4 w-4 mr-1" />
                            Order ID
                          </p>
                          <p className="font-mono text-gray-900 font-semibold">{order._id.slice(-8)}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Date Placed
                          </p>
                          <p className="text-gray-900 font-medium">{formatDate(order.createdAt)}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500 flex items-center">
                            <CreditCard className="h-4 w-4 mr-1" />
                            Total Amount
                          </p>
                          <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                            ₱{order.total.toFixed(2)}
                          </p>
                        </div>
                        
                        {/* ✅ MODIFIED: Status with Rate It button */}
                        <div className="space-y-1 col-span-2 md:col-span-1">
                          <p className="text-sm font-medium text-gray-500">Status</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className={`inline-flex items-center px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-bold ${statusStyle.bg} ${statusStyle.text} border-2 ${statusStyle.border} shadow-md`}>
                              {statusStyle.icon}
                              <span className="ml-2">{order.status}</span>
                            </div>
                            
                            {/* ✅ NEW: Rate It button - only show for Completed orders */}
                            {(order.status === "Completed" || order.status === "Delivered") && (
                              <button
                                onClick={() => openRatingModal(order)}
                                className={`inline-flex items-center px-3 py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                                  order.hasRated || order.rating
                                    ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-2 border-green-300'
                                    : 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-2 border-orange-300 hover:from-yellow-200 hover:to-orange-200 animate-pulse'
                                }`}
                              >
                                <Star className={`h-4 w-4 mr-1 ${order.hasRated || order.rating ? 'fill-current' : ''}`} />
                                {order.hasRated || order.rating ? 'Rated' : 'Rate It'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                      onClick={() => toggleOrderDetails(order._id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-xl group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                            <Package className="h-6 w-6 text-blue-700" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                            {order.items?.length || 0}
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">
                            {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <CreditCard className="h-4 w-4 mr-1" />
                            {order.paymentMethod}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                        {isExpanded ? (
                          <>
                            <span className="text-sm mr-2">Hide Details</span>
                            <ChevronUp className="h-5 w-5 transform group-hover:scale-110 transition-transform" />
                          </>
                        ) : (
                          <>
                            <span className="text-sm mr-2">View Details</span>
                            <ChevronDown className="h-5 w-5 transform group-hover:scale-110 transition-transform" />
                          </>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-6 py-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100">
                        <div className="mb-6">
                          <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
                            <Coffee className="h-5 w-5 mr-2 text-blue-600" />
                            Order Items
                          </h3>
                          <div className="space-y-3">
                            {order.items && order.items.length > 0 ? order.items.map((item, index) => {
                              const productInfo = getProductInfo(item);
                              
                              return (
                                <div key={index} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-md border border-gray-100 group hover:shadow-lg transition-all duration-300">
                                  <div className="flex items-center">
                                    {productInfo.image && !productInfo.isDeleted ? (
                                      <img 
                                        src={productInfo.image} 
                                        alt={productInfo.name} 
                                        className="w-16 h-16 object-cover rounded-xl mr-4 border-2 border-gray-200 group-hover:border-blue-300 transition-colors"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div 
                                      className={`w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center mr-4 ${
                                        productInfo.image && !productInfo.isDeleted ? 'hidden' : ''
                                      }`}
                                    >
                                      <Coffee className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <div>
                                      <p className={`font-bold text-lg ${productInfo.isDeleted ? 'text-gray-500 italic' : 'text-gray-900'}`}>
                                        {productInfo.name}
                                      </p>
                                      <p className="text-sm text-gray-600 flex items-center">
                                        ₱{item.price ? item.price.toFixed(2) : '0.00'} × {item.quantity || 0}
                                        {productInfo.isDeleted && (
                                          <span className="ml-2 text-xs text-red-500 bg-red-100 px-2 py-1 rounded-full">(Product deleted)</span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="font-bold text-xl text-blue-600">₱{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                                </div>
                              );
                            }) : (
                              <div className="bg-white p-6 rounded-xl shadow-md text-center border border-gray-100">
                                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500 font-medium">No items found in this order</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
                              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                              Delivery Information
                            </h3>
                            <div className="flex items-start space-x-3">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <Truck className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Delivery Address:</p>
                                <p className="text-gray-900 font-medium leading-relaxed">
                                  {order.deliveryAddress || "No delivery address provided."}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start space-x-3 mt-4 pt-4 border-t border-gray-200">
                              <div className="bg-indigo-100 p-2 rounded-lg">
                                <MessageCircle className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Assigned Driver:</p>
                                <p className="text-gray-900 font-medium leading-relaxed">
                                  {order.driverAssigned?.name || "Waiting for driver assignment"}
                                </p>
                              </div>
                            </div>
                            
                            {/* Optional: Display GCash Reference if available */}
                            {order.gcashReferenceNumber && (
                              <div className="flex items-start space-x-3 mt-4 pt-4 border-t border-gray-200">
                                <div className="bg-green-100 p-2 rounded-lg">
                                  <CreditCard className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">GCash Reference:</p>
                                  <p className="text-gray-900 font-mono font-medium">
                                    {order.gcashReferenceNumber}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
                              <Clock className="h-5 w-5 mr-2 text-blue-600" />
                              Order Timeline
                            </h3>
                            <div className="space-y-3">
                              <div className="flex items-start space-x-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                  <Calendar className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900">Order Placed</p>
                                  <p className="text-xs text-gray-600">{formatDate(order.createdAt)}</p>
                                </div>
                              </div>
                              
                              {order.status !== "Pending" && (
                                <div className="flex items-start space-x-3">
                                  <div className="bg-blue-100 p-2 rounded-lg">
                                    {statusStyle.icon}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">Status Updated to {order.status}</p>
                                    <p className="text-xs text-gray-600">{formatDate(order.updatedAt)}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 bg-white rounded-xl shadow-md p-6 border border-gray-100">
                          <div className="space-y-3">
                            {/* ✅ CRITICAL FIX: Check if total already includes delivery fee */}
                            <div className="flex justify-between text-gray-600">
                              <span>Subtotal</span>
                              <span className="font-medium">
                                ₱{(() => {
                                  // If deliveryFee exists in the order data
                                  if (order.deliveryFee !== undefined) {
                                    const calculatedSubtotal = order.total - order.deliveryFee;
                                    // Check if the subtotal makes sense (should be positive and reasonable)
                                    // If subtotal is negative or too small, the total might NOT include delivery fee
                                    if (calculatedSubtotal < 0 || calculatedSubtotal < order.deliveryFee * 0.5) {
                                      // Total probably doesn't include delivery fee yet
                                      return order.total.toFixed(2);
                                    }
                                    // Total includes delivery fee
                                    return calculatedSubtotal.toFixed(2);
                                  }
                                  // Old orders without deliveryFee field - assume ₱50 was added
                                  return (order.total - 50).toFixed(2);
                                })()}
                              </span>
                            </div>
                            
                            {/* ✅ CRITICAL FIX: Display delivery fee correctly */}
                            <div className="flex justify-between text-gray-600">
                              <span className="flex items-center">
                                Delivery Fee
                                {order.deliveryDistance && order.deliveryDistance > 0 && (
                                  <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                    {order.deliveryDistance.toFixed(2)} km
                                  </span>
                                )}
                              </span>
                              <span className="font-medium">
                                {(() => {
                                  // If deliveryFee exists and is exactly 0
                                  if (order.deliveryFee !== undefined) {
                                    if (order.deliveryFee === 0) {
                                      return 'FREE';
                                    }
                                    return `₱${order.deliveryFee.toFixed(2)}`;
                                  }
                                  // Old orders - assume ₱50
                                  return '₱50.00';
                                })()}
                              </span>
                            </div>
                            
                            <div className="border-t pt-3">
                              <div className="flex justify-between items-center">
                                <span className="text-xl font-bold text-gray-900">Total Amount</span>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                                  ₱{(order.total || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap gap-3">
                            <button
                              onClick={() => navigate(`/customer-message?orderId=${order._id}&thread=admin`)}
                              className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold shadow hover:from-blue-700 hover:to-indigo-800 transition-all duration-300"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Message Store Owner
                            </button>

                            {order.driverAssigned && (
                              <button
                                onClick={() => navigate(`/customer-message?orderId=${order._id}&thread=driver`)}
                                className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-700 text-white font-semibold shadow hover:from-teal-700 hover:to-cyan-800 transition-all duration-300"
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Message Driver
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ✅ NEW: Rating Modal */}
      {showRatingModal && selectedOrderForRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold flex items-center">
                    <Star className="h-6 w-6 mr-2" fill="currentColor" />
                    Rate Your Experience
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">
                    Order #{selectedOrderForRating._id.slice(-8)}
                  </p>
                </div>
                <button
                  onClick={closeRatingModal}
                  className="text-white hover:text-gray-200 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Star Rating */}
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-3 text-center text-lg">
                  How would you rate your overall experience?
                </label>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-all duration-200 transform hover:scale-125"
                    >
                      <Star
                        className={`h-12 w-12 ${
                          star <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center mt-3 text-gray-600 font-medium">
                    {rating === 1 && "😞 Poor"}
                    {rating === 2 && "😐 Fair"}
                    {rating === 3 && "🙂 Good"}
                    {rating === 4 && "😊 Very Good"}
                    {rating === 5 && "🤩 Excellent"}
                  </p>
                )}
              </div>

              {/* Feedback Text Area */}
              <div className="mb-6">
                <label className="text-gray-700 font-bold mb-2 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                  Share Your Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us about your experience... What did you love? What could we improve?"
                  rows="5"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">
                    {feedback.length}/500 characters
                  </p>
                  {feedback.trim() && (
                    <p className="text-sm text-green-600 font-medium">
                      ✓ Looking good!
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitRating}
                disabled={isSubmittingRating || rating === 0 || !feedback.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                {isSubmittingRating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Star className="h-5 w-5 mr-2" fill="currentColor" />
                    Submit Rating
                  </>
                )}
              </button>

              {/* Info Text */}
              <p className="text-center text-sm text-gray-500 mt-4">
                Your feedback helps us improve our service and menu offerings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;