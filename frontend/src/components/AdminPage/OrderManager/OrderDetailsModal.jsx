import React from "react";
import { 
  X, 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  ShoppingCart, 
  Search, 
  Image,
  ZoomIn,
  CheckCircle, 
  XCircle, 
  Clock,
  Navigation,
  Truck, // ✅ ADD THIS
  MapPin // ✅ ADD THIS
} from "lucide-react";
import OrderActionButtons from "./OrderActionButtons";
import RouteMap from '../../Map/RouteMap'; // ✅ Add import
import { useAuthStore } from '../../../store/authStore'; // ✅ Add import

const OrderDetailsModal = ({ 
  selectedOrder, 
  setSelectedOrder, 
  formatDate, 
  showProofImage, 
  setShowProofImage, 
  setFullScreenImage, 
  API_BASE_URL,
  updateOrderStatus,
  deleteOrder,
  isLoading
}) => {
  const { user } = useAuthStore(); // ✅ Get admin user data

  // ✅ ADD THIS DEBUG LOGGING
  console.log("═══════════════════════════════════════");
  console.log("🗺️ ROUTE MAP DEBUG:");
  console.log("═══════════════════════════════════════");
  console.log("📦 Selected Order ID:", selectedOrder?._id);
  console.log("👤 Customer Data:", selectedOrder?.customer);
  console.log("📍 Customer Location:", selectedOrder?.customer?.location);
  console.log("👨‍💼 Admin Data:", user);
  console.log("📍 Admin Location:", user?.location);
  console.log("✅ Should show map?", !!(selectedOrder?.customer?.location && user?.location));
  console.log("═══════════════════════════════════════");

  const getStatusIcon = (status) => {
    switch(status) {
      case "Completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "Cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "Processing":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "Pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };
  
  const getStatusClass = (status) => {
    switch(status) {
      case "Completed":
        return "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300";
      case "Cancelled":
        return "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300";
      case "Processing":
        return "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300";
      case "Pending":
        return "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300";
    }
  };
  
  const getPaymentBadge = (paymentMethod) => {
    switch(paymentMethod) {
      case "GCash":
        return (
          <span className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-sm">
            <Image className="h-3 w-3 mr-1" />
            GCash
          </span>
        );
      case "Cash on Delivery":
        return (
          <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-sm">
            Cash on Delivery
          </span>
        );
      default:
        return (
          <span className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-sm">
            {paymentMethod}
          </span>
        );
    }
  };

  // Updated function to properly handle Cloudinary URLs
  const getProofImageUrl = (proofPath) => {
    if (!proofPath) {
      console.log('❌ No proof path provided');
      return '';
    }
    
    console.log('🔍 Processing proof image path:', proofPath);
    
    // If it's already a full Cloudinary URL (starts with https://res.cloudinary.com)
    if (proofPath.startsWith('https://res.cloudinary.com')) {
      console.log('✅ Full Cloudinary URL detected:', proofPath);
      return proofPath;
    }
    
    // If it's already a full HTTPS URL (could be other cloud storage)
    if (proofPath.startsWith('https://')) {
      console.log('✅ Full HTTPS URL detected:', proofPath);
      return proofPath;
    }
    
    // If it's a relative path starting with /uploads (local storage)
    if (proofPath.startsWith('/uploads')) {
      console.log('📁 Local uploads path detected, using API_BASE_URL:', `${API_BASE_URL}${proofPath}`);
      return `${API_BASE_URL}${proofPath}`;
    }
    
    // If it's just a filename or relative path without /uploads (assume local)
    if (!proofPath.startsWith('http') && !proofPath.startsWith('/')) {
      console.log('📁 Relative path detected, constructing local URL:', `${API_BASE_URL}/uploads/${proofPath}`);
      return `${API_BASE_URL}/uploads/${proofPath}`;
    }
    
    // If it's a relative path starting with / but not /uploads
    if (proofPath.startsWith('/') && !proofPath.startsWith('/uploads')) {
      console.log('📁 Root relative path detected, using API_BASE_URL:', `${API_BASE_URL}${proofPath}`);
      return `${API_BASE_URL}${proofPath}`;
    }
    
    // Default case - return as is
    console.log('⚠️ Using proof path as is:', proofPath);
    return proofPath;
  };

  if (!selectedOrder) return null;

  const proofImageUrl = getProofImageUrl(selectedOrder.proofOfPayment);
  
  // Add console log to debug the final URL
  console.log('🖼️ Final proof image URL:', proofImageUrl);
  console.log('📋 Selected order proof of payment:', selectedOrder.proofOfPayment);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 md:px-6 md:py-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg md:text-xl font-bold">Order Details</h3>
              <p className="text-blue-100 text-sm">Order #{selectedOrder._id.slice(-8)}</p>
            </div>
            <button 
              onClick={() => setSelectedOrder(null)}
              className="text-white hover:text-gray-200 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            {/* Customer & Order Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
              {/* Customer Information Card */}
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
                    <span className="font-bold text-blue-900">{selectedOrder.customer.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700 text-sm font-medium">Email:</span>
                    <span className="text-blue-800">{selectedOrder.customer.email}</span>
                  </div>
                  {selectedOrder.customer.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-700 text-sm font-medium">Phone:</span>
                      <span className="text-blue-800">{selectedOrder.customer.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Information Card */}
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
                  
                  {/* ✅ FIXED: Delivery Fee Breakdown - Only show if data exists */}
                  {selectedOrder.deliveryDistance !== undefined && selectedOrder.deliveryFee !== undefined && (
                    <>
                      <div className="border-t border-green-200 pt-2 mt-2">
                        <p className="text-xs text-green-700 font-bold mb-2">Delivery Details:</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="text-green-700 text-sm">Distance:</span>
                        </div>
                        <span className="text-green-900 font-medium">{selectedOrder.deliveryDistance.toFixed(2)} km</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-green-600" />
                          <span className="text-green-700 text-sm">Delivery Fee:</span>
                        </div>
                        <span className={`font-bold ${selectedOrder.deliveryFee === 0 ? 'text-green-600' : 'text-green-900'}`}>
                          {selectedOrder.deliveryFee === 0 ? 'FREE' : `₱${selectedOrder.deliveryFee.toFixed(2)}`}
                        </span>
                      </div>
                      
                      {selectedOrder.deliveryFee === 0 && (
                        <div className="bg-green-200 border border-green-400 rounded-lg p-2 text-center">
                          <span className="text-green-900 text-xs font-bold">🎉 Free Delivery Applied</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="flex items-center justify-between border-t border-green-200 pt-2 mt-2">
                    <span className="text-green-700 text-sm font-medium">Total:</span>
                    <span className="font-bold text-xl text-green-600">₱{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address Section */}
            {selectedOrder.deliveryAddress && (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-2xl p-6 mb-6">
                <div className="flex items-center mb-3">
                  <div className="bg-orange-500 p-2 rounded-xl mr-3 shadow-lg">
                    <Search className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-bold text-orange-800 text-lg">Delivery Address</h4>
                </div>
                <p className="text-orange-700 bg-orange-100 p-4 rounded-xl border border-orange-200">{selectedOrder.deliveryAddress}</p>
              </div>
            )}

            {/* ✅ NEW: Route Map Section */}
            {selectedOrder.customer?.location && user?.location && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
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

            {/* Notes Section */}
            {selectedOrder.notes && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 mb-6">
                <div className="flex items-center mb-3">
                  <div className="bg-yellow-500 p-2 rounded-xl mr-3 shadow-lg">
                    <Search className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-bold text-yellow-800 text-lg">Order Notes</h4>
                </div>
                <p className="text-yellow-700 bg-yellow-100 p-4 rounded-xl border border-yellow-200">{selectedOrder.notes}</p>
              </div>
            )}

            {/* GCash Reference Number Section */}
            {selectedOrder.gcashReference && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-500 p-2 rounded-xl mr-3 shadow-lg">
                    <Image className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-bold text-blue-800 text-lg">GCash Reference Number</h4>
                </div>
                <p className="text-blue-700 bg-blue-100 p-4 rounded-xl border border-blue-200 font-mono text-lg">{selectedOrder.gcashReference}</p>
              </div>
            )}

            {/* Proof of Payment Section */}
            {selectedOrder.proofOfPayment && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <div className="bg-purple-500 p-2 rounded-xl mr-3 shadow-lg">
                      <Image className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-bold text-purple-800 text-lg">Proof of Payment</h4>
                  </div>
                  <button 
                    onClick={() => setShowProofImage(!showProofImage)}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    {showProofImage ? "Hide" : "Show"} Image
                  </button>
                </div>
                
                {/* Debug information (remove in production)
                <div className="mb-2 text-xs text-gray-500 bg-gray-100 p-2 rounded">
                  <strong>Debug Info:</strong><br/>
                  Raw proof path: {selectedOrder.proofOfPayment}<br/>
                  Final URL: {proofImageUrl}
                </div> */}
                
                {showProofImage && (
                  <div className="mt-4">
                    <div className="flex justify-center">
                      <img 
                        src={proofImageUrl}
                        alt="Proof of Payment" 
                        className="max-h-48 md:max-h-64 rounded-xl shadow-lg border-2 border-purple-200 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        onClick={() => setFullScreenImage(proofImageUrl)}
                        onError={(e) => {
                          console.error('❌ Error loading proof image:', {
                            src: e.target.src,
                            originalProofPath: selectedOrder.proofOfPayment,
                            error: e
                          });
                          e.target.style.border = '2px solid red';
                          e.target.alt = 'Failed to load image';
                        }}
                        onLoad={() => {
                          console.log('✅ Proof image loaded successfully:', proofImageUrl);
                        }}
                      />
                    </div>
                    <div className="flex justify-center mt-4">
                      <button 
                        onClick={() => setFullScreenImage(proofImageUrl)}
                        className="text-purple-600 hover:text-purple-800 font-medium flex items-center space-x-2 bg-purple-100 hover:bg-purple-200 px-4 py-2 rounded-xl transition-all duration-300"
                      >
                        <ZoomIn className="h-4 w-4" />
                        <span>View Full Size</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Order Items */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b-2 border-gray-200">
                <h4 className="font-bold text-gray-900 text-lg flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-3 text-blue-600" />
                  Order Items ({selectedOrder.items.length})
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
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700 text-right">₱{item.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">₱{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-green-50 to-green-100">
                    {/* ✅ CRITICAL FIX: Show breakdown only if deliveryFee data exists */}
                    {selectedOrder.deliveryFee !== undefined && selectedOrder.deliveryDistance !== undefined ? (
                      <>
                        <tr className="border-t border-green-200">
                          <td colSpan="3" className="px-6 py-3 text-right text-sm font-medium text-gray-700">Subtotal:</td>
                          <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                            ₱{(() => {
                              const calculatedSubtotal = selectedOrder.total - selectedOrder.deliveryFee;
                              // Check if the subtotal makes sense
                              if (calculatedSubtotal < 0 || calculatedSubtotal < selectedOrder.deliveryFee * 0.5) {
                                // Total probably doesn't include delivery fee yet
                                return selectedOrder.total.toFixed(2);
                              }
                              return calculatedSubtotal.toFixed(2);
                            })()}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                            Delivery Fee {selectedOrder.deliveryDistance > 0 && `(${selectedOrder.deliveryDistance.toFixed(2)} km)`}:
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                            {/* ✅ CRITICAL FIX: Only show FREE if deliveryFee is EXACTLY 0 */}
                            {selectedOrder.deliveryFee === 0 ? (
                              <span className="text-green-600">FREE</span>
                            ) : (
                              `₱${selectedOrder.deliveryFee.toFixed(2)}`
                            )}
                          </td>
                        </tr>
                        <tr className="border-t-2 border-green-300">
                          <td colSpan="3" className="px-6 py-4 text-right text-lg font-bold text-gray-900">Total Amount:</td>
                          <td className="px-6 py-4 text-right text-xl font-bold text-green-600">
                            ₱{(() => {
                              const calculatedSubtotal = selectedOrder.total - selectedOrder.deliveryFee;
                              // If total doesn't include delivery fee, add it
                              if (calculatedSubtotal < 0 || calculatedSubtotal < selectedOrder.deliveryFee * 0.5) {
                                return (selectedOrder.total + selectedOrder.deliveryFee).toFixed(2);
                              }
                              return selectedOrder.total.toFixed(2);
                            })()}
                          </td>
                        </tr>
                      </>
                    ) : (
                      // ✅ Fallback for old orders without delivery fee data
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-right text-lg font-bold text-gray-900">Total Amount:</td>
                        <td className="px-6 py-4 text-right text-xl font-bold text-green-600">₱{selectedOrder.total.toFixed(2)}</td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons at the bottom - Using OrderActionButtons component */}
        <OrderActionButtons 
          selectedOrder={selectedOrder}
          updateOrderStatus={updateOrderStatus}
          deleteOrder={deleteOrder}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default OrderDetailsModal;