import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import CustomerSideNav from "../../pages/customer/customerSideNav";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Truck, Calendar, Clock, ChevronDown, ChevronUp, Package } from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "../../store/authStore";

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // API base URL for images
  const API_BASE_URL = import.meta.env.MODE === "development" 
    ? "http://localhost:5000" 
    : "";

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch customer's orders
  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      toast.error("Please log in to view your orders");
      navigate("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const apiUrl = import.meta.env.MODE === "development" 
          ? "http://localhost:5000/api/orders/customer" 
          : "/api/orders/customer";
        
        // Add user email as query parameter instead of relying on token
        const response = await axios.get(`${apiUrl}?email=${encodeURIComponent(user.email)}`, { 
          withCredentials: true
        });
        
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching orders:", error);
        // Show more specific error message
        if (error.response?.data?.message) {
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

  // Toggle order details expansion
  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Processing":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format date
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

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 relative">
      {/* Sidebar */}
      <CustomerSideNav />

      {/* Main Content */}
      <main className={`flex-1 ${isMobile ? 'pb-20' : 'pb-0'}`}>
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-blue-900 mb-6">My Orders</h1>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-medium text-gray-700 mb-2">No orders yet</h2>
              <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
              <button 
                onClick={() => navigate('/customer-buy')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Order Header */}
                  <div className="p-4 border-b">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div>
                        <p className="text-sm text-gray-500">Order ID</p>
                        <p className="font-mono text-gray-800">{order._id.slice(-8)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date Placed</p>
                        <p className="text-gray-800">{formatDate(order.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="font-medium text-blue-700">₱{order.total.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div 
                    className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleOrderDetails(order._id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Package className="h-5 w-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="font-medium">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</p>
                        <p className="text-sm text-gray-500">{order.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-blue-600">
                      {expandedOrder === order._id ? (
                        <>
                          <span className="text-sm mr-1">Hide Details</span>
                          <ChevronUp className="h-5 w-5" />
                        </>
                      ) : (
                        <>
                          <span className="text-sm mr-1">View Details</span>
                          <ChevronDown className="h-5 w-5" />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded Order Details */}
                  {expandedOrder === order._id && (
                    <div className="px-4 py-3 bg-gray-50 border-t">
                      <div className="mb-4">
                        <h3 className="font-medium text-gray-900 mb-2">Order Items</h3>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                              <div className="flex items-center">
                                {item.product.image ? (
                                  <img 
                                    src={`${API_BASE_URL}${item.product.image}`} 
                                    alt={item.product.name} 
                                    className="w-12 h-12 object-cover rounded mr-3"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center mr-3">
                                    <ShoppingBag className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{item.product.name}</p>
                                  <p className="text-sm text-gray-500">₱{item.price.toFixed(2)} × {item.quantity}</p>
                                </div>
                              </div>
                              <p className="font-medium">₱{(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">Delivery Information</h3>
                          <div className="bg-white p-3 rounded-md shadow-sm">
                            <div className="flex items-start mb-2">
                              <Truck className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-700">{order.notes || "No delivery instructions provided."}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">Order Timeline</h3>
                          <div className="bg-white p-3 rounded-md shadow-sm">
                            <div className="flex items-start">
                              <Clock className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Order Placed</p>
                                <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                                
                                {order.status !== "Pending" && (
                                  <>
                                    <div className="h-4 border-l border-gray-300 ml-2"></div>
                                    <p className="text-sm font-medium">Status Updated</p>
                                    <p className="text-xs text-gray-500">{formatDate(order.updatedAt)}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 border-t pt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">Subtotal</span>
                          <span>₱{order.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">Delivery</span>
                          <span>₱50.00</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-2">
                          <span>Total</span>
                          <span>₱{(order.total + 50).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomerOrders;