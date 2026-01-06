import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import DriverSideNav from "../../pages/driver/driverSideNav";
import { useMessageNotifications } from "../../context/MessageNotificationContext";
import { Navigation, Truck, MapPin, Users, Mail, Phone, Calendar, ShoppingCart, Image, ZoomIn, CheckCircle, XCircle, Clock, ClipboardList, Search, Filter } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import RouteMap from "../Map/RouteMap";

const API_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
const API_URL_ORDERS = `${API_BASE_URL}/api/orders`;

const DriverOrdersPage = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [orders, setOrders] = useState([]);
  // ADD: status filter state
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  // Mobile modal gating to prevent immediate auto-open
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProofImage, setShowProofImage] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useMessageNotifications();

  // Read orderId from the query string for deep-link selection
  const params = new URLSearchParams(location.search);
  const selectedOrderId = params.get("orderId");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_URL_ORDERS}`, { withCredentials: true });
        const list = (res.data || []).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(list);

        // Desktop: auto select (first or deep-link)
        // Mobile: only auto-select if orderId param present (deep link); do not show modal until user taps
        if (isMobile) {
          if (selectedOrderId) {
            const match = list.find(o => o._id === selectedOrderId);
            if (match) {
              setSelectedOrder(match);
              setShowDetailsModal(true); // deep link opens modal on mobile
            }
          }
        } else { // Desktop
          if (selectedOrderId) {
            const match = list.find(o => o._id === selectedOrderId);
            if (match) {
              setSelectedOrder(match);
            } else if (list.length) {
              setSelectedOrder(list[0]);
            } else {
              setSelectedOrder(null);
            }
          } else if (!selectedOrder && list.length) {
            setSelectedOrder(list[0]);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrderId, isMobile]);

  useEffect(() => {
    if (!socket) return;
    const handleAssign = (payload) => {
      if (!payload?.order) return;
      setOrders(prev => {
        const idx = prev.findIndex(o => o._id === payload.order._id);
        let next;
        if (idx >= 0) {
          next = [...prev];
          next[idx] = payload.order;
        } else {
          next = [payload.order, ...prev];
        }

        // Desktop auto-update selection; mobile only update if currently viewing that order
        if (selectedOrderId && payload.order._id === selectedOrderId) {
          setSelectedOrder(payload.order);
        } else if (!isMobile && !selectedOrder && next.length) {
          setSelectedOrder(next[0]);
        }
        return next;
      });
    };
    socket.on("order-assigned", handleAssign);
    socket.on("order-updated", handleAssign);
    return () => {
      socket.off("order-assigned", handleAssign);
      socket.off("order-updated", handleAssign);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, user?._id, selectedOrderId, selectedOrder, isMobile]);

  const handleSelectOrder = (o) => {
    setSelectedOrder(o);
    const search = new URLSearchParams(location.search);
    search.set("orderId", o._id);
    navigate({ pathname: "/driver-orders", search: search.toString() }, { replace: false });
    if (isMobile) {
      setShowDetailsModal(true);
      // lock background scroll
      document.documentElement.style.overflow = 'hidden';
    }
  };

  const closeMobileModal = () => {
    setShowDetailsModal(false);
    document.documentElement.style.overflow = '';
    // Optionally remove orderId param for clean state
    const search = new URLSearchParams(location.search);
    search.delete('orderId');
    navigate({ pathname: '/driver-orders', search: search.toString() }, { replace: true });
  };

  // Ensure scroll unlocked when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      document.documentElement.style.overflow = '';
      setShowDetailsModal(false);
    }
  }, [isMobile]);

  const formatDate = (dateString) => {
    const options = { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "Completed": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "Cancelled": return <XCircle className="h-5 w-5 text-red-500" />;
      case "Delivered": return <Truck className="h-5 w-5 text-blue-500" />;
      case "Processing": return <Clock className="h-5 w-5 text-blue-500" />;
      case "Pending": return <Clock className="h-5 w-5 text-yellow-500" />;
      default: return null;
    }
  };
  const getStatusClass = (status) => {
    switch(status) {
      case "Completed": return "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300";
      case "Cancelled": return "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300";
      case "Delivered": return "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300";
      case "Processing": return "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300";
      case "Pending": return "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300";
      default: return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300";
    }
  };


  const getPaymentBadge = (paymentMethod) => {
  };
  
  const getProofImageUrl = (proofPath) => {
    if (!proofPath) return "";
    if (proofPath.startsWith('https://res.cloudinary.com')) return proofPath;
    if (proofPath.startsWith('https://')) return proofPath;
    if (proofPath.startsWith('/uploads')) return `${API_BASE_URL}${proofPath}`;
    if (!proofPath.startsWith('http') && !proofPath.startsWith('/')) return `${API_BASE_URL}/uploads/${proofPath}`;
    if (proofPath.startsWith('/') && !proofPath.startsWith('/uploads')) return `${API_BASE_URL}${proofPath}`;
    return proofPath;
  };

  const proofImageUrl = getProofImageUrl(selectedOrder?.proofOfPayment);

  // Handle window resize (match other pages)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DriverSideNav />
      <main className={`flex-1 ${isMobile ? 'pb-20' : 'ml-64'} overflow-y-auto`}>
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
            <div className="relative px-6 py-6 md:py-8">
              <div className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-white/10 backdrop-blur-sm rounded-full text-blue-200 text-xs md:text-sm font-medium mb-3 md:mb-4">
                <ClipboardList className="h-4 w-4 mr-2" />
                Order Notifications
              </div>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">Orders</h1>
                  <p className="text-blue-100 text-sm md:text-lg">Tap an order to view full details</p>
                </div>
                {/* ADD: Status filter */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-3 text-black">
                  <label className="text-xs md:text-sm font-medium flex items-center mb-1">
                    <Filter className="h-4 w-4 mr-2" /> Filter by status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs md:text-sm bg-white/20 border border-white/30 rounded-lg px-3 py-2 focus:outline-none"
                  >
                    {["All", "Pending", "Processing", "Delivered", "Completed", "Cancelled"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: single-column list; Desktop: 3-column with details */}
          <div className={`${isMobile ? 'grid grid-cols-1' : 'grid grid-cols-1 lg:grid-cols-3'} gap-4 md:gap-6`}>
            {/* Orders list */}
            <div className="bg-white rounded-2xl shadow-lg border">
              <div className="px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b">
                <h3 className="font-bold text-gray-900 text-base md:text-lg">Orders</h3>
              </div>
              <div className="divide-y max-h-[70vh] overflow-y-auto">
                {isLoading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  // APPLY FILTER
                  (() => {
                    const filtered = statusFilter === "All"
                      ? orders
                      : orders.filter(o => o.status === statusFilter);

                    return filtered.length === 0 ? (
                      <div className="p-6 text-center text-gray-600">No orders{statusFilter !== "All" ? ` for ${statusFilter}` : ""}.</div>
                    ) : (
                      filtered.map((o) => (
                        <button
                          key={o._id}
                          onClick={() => handleSelectOrder(o)}
                          className={`w-full text-left px-4 md:px-5 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition group ${selectedOrder?._id === o._id && !isMobile ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="font-bold text-gray-900 text-sm md:text-base truncate max-w-[70%]">#{o._id.slice(-8)}</div>
                                <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border ${getStatusClass(o.status)} flex items-center shrink-0`}>
                                  {getStatusIcon(o.status)}
                                  <span className="ml-1 truncate max-w-[60px]">{o.status}</span>
                                </span>
                              </div>
                              <div className="text-[11px] md:text-xs text-gray-600 truncate">{formatDate(o.createdAt)}</div>
                              <div className="text-[11px] md:text-xs text-gray-700">
                                <span className="font-medium">By:</span> <span className="truncate inline-block max-w-[140px] align-middle">{o.customer?.name || 'Unknown'}</span>
                              </div>
                              {o.deliveryAddress && (
                                <div className="text-[11px] md:text-xs text-gray-700 leading-snug whitespace-normal break-words max-w-full">
                                  <span className="font-medium">To:</span> <span className="line-clamp-2 block">{o.deliveryAddress}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    );
                  })()
                )}
              </div>
            </div>

            {/* Desktop details panel */}
            {!isMobile && (
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border overflow-hidden">
                {selectedOrder ? (
                  <>
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold">Order Details</h3>
                        <p className="text-blue-100 text-sm">Order #{selectedOrder._id.slice(-8)}</p>
                      </div>
                    </div>
                    <div className="p-6 space-y-6">
                      {/* Customer Info & Order Info */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                          <div className="flex items-center mb-4">
                            <div className="bg-blue-500 p-3 rounded-xl mr-3 shadow-lg">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="font-bold text-blue-900 text-lg">Customer Information</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="text-blue-700 text-sm font-medium">Name:</span>
                              <span className="font-bold text-blue-900">{selectedOrder.customer?.name}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Mail className="h-4 w-4 text-blue-600" />
                              <span className="text-blue-700 text-sm font-medium">Email:</span>
                              <span className="text-blue-800">{selectedOrder.customer?.email}</span>
                            </div>
                            {selectedOrder.customer?.phone && (
                              <div className="flex items-center space-x-3">
                                <Phone className="h-4 w-4 text-blue-600" />
                                <span className="text-blue-700 text-sm font-medium">Phone:</span>
                                <span className="text-blue-800">{selectedOrder.customer?.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                          <div className="flex items-center mb-4">
                            <div className="bg-green-500 p-3 rounded-xl mr-3 shadow-lg">
                              <ShoppingCart className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="font-bold text-green-900 text-lg">Order Information</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-green-600" />
                                <span className="text-green-700 text-sm font-medium">Date:</span>
                              </div>
                              <span className="font-bold text-green-900">{formatDate(selectedOrder.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-green-700 text-sm font-medium">Status:</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center ${getStatusClass(selectedOrder.status)}`}>
                                {getStatusIcon(selectedOrder.status)}
                                <span className="ml-1">{selectedOrder.status}</span>
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-green-700 text-sm font-medium">Payment:</span>
                              {getPaymentBadge(selectedOrder.paymentMethod)}
                            </div>

                            {/* Delivery Details */}
                            {selectedOrder.deliveryDistance !== undefined && selectedOrder.deliveryFee !== undefined && (
                              <>
                                <div className="border-t border-green-200 pt-2 mt-2">
                                  <p className="text-[11px] text-green-700 font-bold mb-2">Delivery Details:</p>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-green-600" />
                                    <span className="text-green-700 text-sm">Distance:</span>
                                  </div>
                                  <span className="text-green-900 font-medium">{Number(selectedOrder.deliveryDistance).toFixed(2)} km</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-green-600" />
                                    <span className="text-green-700 text-sm">Delivery Fee:</span>
                                  </div>
                                  <span className={`font-bold ${selectedOrder.deliveryFee === 0 ? 'text-green-600' : 'text-green-900'}`}>
                                    {selectedOrder.deliveryFee === 0 ? 'FREE' : `₱${Number(selectedOrder.deliveryFee).toFixed(2)}`}
                                  </span>
                                </div>
                              </>
                            )}

                            <div className="flex items-center justify-between border-t border-green-200 pt-2 mt-2">
                              <span className="text-green-700 text-sm font-medium">Total:</span>
                              <span className="font-bold text-xl text-green-600">₱{Number(selectedOrder.total).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Address */}
                      {selectedOrder.deliveryAddress && (
                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-2xl p-6">
                          <div className="flex items-center mb-3">
                            <div className="bg-orange-500 p-2 rounded-xl mr-3 shadow-lg">
                              <Search className="h-4 w-4 text-white" />
                            </div>
                            <h4 className="font-bold text-orange-800 text-lg">Delivery Address</h4>
                          </div>
                          <p className="text-orange-700 bg-orange-100 p-4 rounded-xl border border-orange-200">{selectedOrder.deliveryAddress}</p>
                        </div>
                      )}

                     {/* ✅ NEW: Delivery Route (replaces Schedule) */}
                     {selectedOrder.customer?.location && user?.location && (
                       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                         <div className="flex items-center mb-4">
                           <div className="bg-blue-500 p-2 rounded-xl mr-3 shadow-lg">
                             <Navigation className="h-5 w-5 text-white" />
                           </div>
                           <h4 className="font-bold text-blue-800 text-lg">Delivery Route</h4>
                         </div>
                         <RouteMap
                           cafeCoords={user.location}
                           customerCoords={selectedOrder.customer.location}
                           cafeAddress={user.address}
                           customerAddress={selectedOrder.deliveryAddress}
                         />
                       </div>
                     )}

                      {/* Proof of Payment (moved below route) */}
                      {selectedOrder.proofOfPayment && (
                        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center">
                              <Image className="h-5 w-5 mr-2 text-purple-600" />
                              Proof of Payment
                            </h3>
                            <button 
                              onClick={() => setShowProofImage(!showProofImage)}
                              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-3 py-1.5 rounded-lg text-sm"
                            >
                              {showProofImage ? "Hide" : "Show"}
                            </button>
                          </div>
                          {showProofImage && (
                            <div className="mt-2">
                              <img
                                src={proofImageUrl}
                                alt="Proof"
                                className="max-h-64 rounded-xl shadow border"
                                onClick={() => setFullScreenImage(proofImageUrl)}
                              />
                              <button
                                onClick={() => setFullScreenImage(proofImageUrl)}
                                className="mt-2 inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium"
                              >
                                <ZoomIn className="h-4 w-4" /> View Full Size
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Items */}
                      <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg">
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b-2 border-gray-200">
                          <h4 className="font-bold text-gray-900 text-lg flex items-center">
                            <ShoppingCart className="h-5 w-5 mr-3 text-blue-600" />
                            Items ({selectedOrder.items?.length || 0})
                          </h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                              <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Item</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Qty</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {(selectedOrder.items || []).map((item, index) => (
                                <tr key={index} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.name}</td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                      {item.quantity}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm font-medium text-gray-700 text-right">₱{Number(item.price).toFixed(2)}</td>
                                  <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">₱{(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-gray-600">Select an order to view details</div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile full-screen modal for order details */}
      {isMobile && showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={closeMobileModal} />
          <div className="absolute inset-x-0 bottom-0 top-0 bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between sticky top-0">
              <div>
                <h3 className="text-base font-bold">Order #{selectedOrder._id.slice(-8)}</h3>
                <p className="text-blue-100 text-xs">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button
                onClick={closeMobileModal}
                className="bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Customer Info */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-500 p-2 rounded-lg mr-3 shadow">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-bold text-blue-900 text-base">Customer</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700 font-medium">Name:</span>
                    <span className="font-semibold text-blue-900">{selectedOrder.customer?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700 font-medium">Email:</span>
                    <span className="text-blue-800">{selectedOrder.customer?.email}</span>
                  </div>
                  {selectedOrder.customer?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-700 font-medium">Phone:</span>
                      <span className="text-blue-800">{selectedOrder.customer?.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center mb-3">
                  <div className="bg-green-500 p-2 rounded-lg mr-3 shadow">
                    <ShoppingCart className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-bold text-green-900 text-base">Order</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-[11px] font-bold border flex items-center ${getStatusClass(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span className="ml-1">{selectedOrder.status}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 font-medium">Payment:</span>
                    {getPaymentBadge(selectedOrder.paymentMethod)}
                  </div>

                  {selectedOrder.deliveryDistance !== undefined && selectedOrder.deliveryFee !== undefined && (
                    <>
                      <div className="border-t border-green-200 pt-2 mt-2">
                        <p className="text-[11px] text-green-700 font-bold mb-2">Delivery Details:</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="text-green-700 text-sm">Distance:</span>
                        </div>
                        <span className="text-green-900 font-medium">{Number(selectedOrder.deliveryDistance).toFixed(2)} km</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-green-600" />
                          <span className="text-green-700 text-sm">Delivery Fee:</span>
                        </div>
                        <span className={`font-bold ${selectedOrder.deliveryFee === 0 ? 'text-green-600' : 'text-green-900'}`}>
                          {selectedOrder.deliveryFee === 0 ? 'FREE' : `₱${Number(selectedOrder.deliveryFee).toFixed(2)}`}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between border-t border-green-200 pt-2 mt-2">
                    <span className="text-green-700 font-medium">Total:</span>
                    <span className="font-bold text-lg text-green-600">₱{Number(selectedOrder.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Address */}
              {selectedOrder.deliveryAddress && (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <div className="bg-orange-500 p-2 rounded-lg mr-3 shadow">
                      <Search className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-bold text-orange-800 text-base">Delivery Address</h4>
                  </div>
                  <p className="text-orange-700 text-sm">{selectedOrder.deliveryAddress}</p>
                </div>
              )}

             {/* ✅ NEW: Delivery Route (mobile) */}
             {selectedOrder.customer?.location && user?.location && (
               <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                 <div className="flex items-center mb-3">
                   <div className="bg-blue-500 p-2 rounded-lg mr-3 shadow">
                     <Navigation className="h-4 w-4 text-white" />
                   </div>
                   <h4 className="font-bold text-blue-800 text-base">Delivery Route</h4>
                 </div>
                 <RouteMap
                   cafeCoords={user.location}
                   customerCoords={selectedOrder.customer.location}
                   cafeAddress={user.address}
                   customerAddress={selectedOrder.deliveryAddress}
                 />
               </div>
             )}

              {/* Proof of Payment */}
              {selectedOrder.proofOfPayment && (
                <div className="bg-white rounded-xl shadow p-4 border">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-base flex items-center">
                      <Image className="h-5 w-5 mr-2 text-purple-600" />
                      Proof of Payment
                    </h3>
                    <button
                      onClick={() => setShowProofImage(!showProofImage)}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-3 py-1.5 rounded-lg text-xs"
                    >
                      {showProofImage ? "Hide" : "Show"}
                    </button>
                  </div>
                  {showProofImage && (
                    <div className="mt-2">
                      <img
                        src={proofImageUrl}
                        alt="Proof"
                        className="max-h-56 rounded-lg shadow border mx-auto"
                        onClick={() => setFullScreenImage(proofImageUrl)}
                      />
                      <button
                        onClick={() => setFullScreenImage(proofImageUrl)}
                        className="mt-2 inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium text-sm"
                      >
                        <ZoomIn className="h-4 w-4" /> View Full Size
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Items */}
              <div className="bg-white border rounded-xl overflow-hidden shadow">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-3 border-b">
                  <h4 className="font-bold text-gray-900 text-base flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
                    Items ({selectedOrder.items?.length || 0})
                  </h4>
                </div>
                <div className="divide-y">
                  {(selectedOrder.items || []).map((item, index) => (
                    <div key={index} className="flex justify-between items-center px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600">Qty: {item.quantity}</div>
                        <div className="text-sm font-bold text-gray-900">₱{(Number(item.price) * Number(item.quantity)).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom spacing for safe area */}
              <div className="h-6" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverOrdersPage;