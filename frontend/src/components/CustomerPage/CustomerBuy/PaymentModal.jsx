import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, CreditCard, Upload, Check, Truck, Loader } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import AddressAutocomplete from '../../Map/AddressAutoComplete'; // ✨ Import
import AddressPickerMap from '../../Map/AddressPickerMap'; // ✨ Import
import { useAuthStore } from '../../../store/authStore';

const PaymentModal = ({ 
  showPaymentModal, 
  setShowPaymentModal, 
  cart, 
  setCart, 
  cartTotal, 
  user, 
  navigate 
}) => {
  const [paymentMethod] = useState("GCash");
  
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || "");
  const [deliveryCoordinates, setDeliveryCoordinates] = useState(
    user?.location ? { lat: user.location.lat, lng: user.location.lng } : null
  );
  
  const [gcashReference, setGcashReference] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [proofImagePreview, setProofImagePreview] = useState(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // ✅ NEW: Delivery fee states
  const [deliveryFee, setDeliveryFee] = useState(50); // Default
  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState(null);

  const fileInputRef = useRef(null);

  // ✅ NEW: Fetch delivery settings on mount
  useEffect(() => {
    fetchDeliverySettings();
  }, []);

  const fetchDeliverySettings = async () => {
    try {
      const apiUrl = import.meta.env.MODE === "development" 
        ? "http://localhost:5000/api/delivery-settings" 
        : "/api/delivery-settings";
      
      const response = await axios.get(apiUrl);
      setDeliverySettings(response.data);
    } catch (error) {
      console.error("Error fetching delivery settings:", error);
    }
  };

  // ✅ NEW: Calculate delivery fee when coordinates change
  useEffect(() => {
    if (deliveryCoordinates && deliverySettings) {
      calculateDeliveryFee();
    }
  }, [deliveryCoordinates, deliverySettings, cartTotal]);

  const calculateDeliveryFee = async () => {
    // Get admin/cafe location from first admin user
    try {
      setIsCalculatingFee(true);
      
      // Fetch admin location
      const usersApiUrl = import.meta.env.MODE === "development" 
        ? "http://localhost:5000/api/users" 
        : "/api/users";
      
      const usersResponse = await axios.get(usersApiUrl, { withCredentials: true });
      const admins = usersResponse.data.filter(u => u.role === 'admin');
      
      if (admins.length === 0 || !admins[0].location) {
        console.warn("No admin location found, using default fee");
        setDeliveryFee(50);
        return;
      }

      const cafeLocation = admins[0].location;
      
      // Calculate distance using Mapbox Directions API
      const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${cafeLocation.lng},${cafeLocation.lat};${deliveryCoordinates.lng},${deliveryCoordinates.lat}`;
      
      const mapboxResponse = await axios.get(url, {
        params: {
          geometries: 'geojson',
          access_token: MAPBOX_TOKEN
        },
        withCredentials: false
      });

      if (mapboxResponse.data.routes && mapboxResponse.data.routes.length > 0) {
        const route = mapboxResponse.data.routes[0];
        const distanceInKm = route.distance / 1000; // Convert meters to km
        
        setDeliveryDistance(distanceInKm);
        
        // Calculate fee using backend
        const feeApiUrl = import.meta.env.MODE === "development" 
          ? "http://localhost:5000/api/delivery-settings/calculate" 
          : "/api/delivery-settings/calculate";
        
        const feeResponse = await axios.post(feeApiUrl, {
          distance: distanceInKm,
          orderTotal: cartTotal
        });

        if (feeResponse.data.success) {
          setDeliveryFee(feeResponse.data.deliveryFee);
          
          // Show free delivery notification
          if (feeResponse.data.isFreeDelivery) {
            toast.success('🎉 Free delivery! Your order qualifies!', {
              duration: 3000
            });
          }
        }
      }
    } catch (error) {
      console.error("Error calculating delivery fee:", error);
      setDeliveryFee(50); // Fallback to default
    } finally {
      setIsCalculatingFee(false);
    }
  };

  const handleAddressSelect = (addressData) => {
    if (addressData) {
      setDeliveryAddress(addressData.address);
      setDeliveryCoordinates({
        lat: addressData.lat,
        lng: addressData.lng
      });
    } else {
      setDeliveryAddress("");
      setDeliveryCoordinates(null);
      setDeliveryFee(50); // Reset to default
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProofImage = async () => {
    if (!proofImage) return "";
    
    const formData = new FormData();
    formData.append('image', proofImage);
    
    try {
      const apiUrl = import.meta.env.MODE === "development" 
        ? "http://localhost:5000/api/orders/upload" 
        : "/api/orders/upload";
        
      const response = await axios.post(apiUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true // ✅ This sends the cookie with JWT token
      });
      
      console.log("Upload response:", response.data);
      
      return response.data.imagePath || "";
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload proof of payment. Please try again.");
      throw new Error("Failed to upload proof of payment image");
    }
  };

  const submitOrder = async () => {
    try {
      setIsProcessingOrder(true);
      
      // Validate delivery address
      if (!deliveryAddress.trim()) {
        toast.error("Please enter a delivery address");
        setIsProcessingOrder(false);
        return;
      }

      // Validate location coordinates
      if (!deliveryCoordinates) {
        toast.error("Please select a valid address from the suggestions");
        setIsProcessingOrder(false);
        return;
      }
      
      // Validate GCash reference number
      if (!gcashReference.trim()) {
        toast.error("Please enter GCash reference number");
        setIsProcessingOrder(false);
        return;
      }
      
      // Validate proof of payment
      if (!proofImage) {
        toast.error("Please upload proof of payment");
        setIsProcessingOrder(false);
        return;
      }
      
      // Upload proof image
      let proofImagePath = "";
      try {
        proofImagePath = await uploadProofImage();
        console.log("📸 Proof image uploaded:", proofImagePath);
      } catch (uploadError) {
        console.error("Error uploading proof:", uploadError);
        setIsProcessingOrder(false);
        return;
      }
      
      // ✅ UPDATED: Build order data with delivery fee and distance
      const orderData = {
        customer: {
          name: user?.name || "Guest",
          email: user?.email || "guest@example.com",
          phone: user?.phone || "",
          location: deliveryCoordinates ? {  // ✅ ADD THIS!
            lat: deliveryCoordinates.lat,
            lng: deliveryCoordinates.lng
          } : null
        },
        items: cart.map(item => ({
          product: item._id,
          name: item.name,
          quantity: Number(item.quantity),
          price: Number(item.price)
        })),
        
        // ✅ Ensure both are numbers before adding
        total: parseFloat((Number(cartTotal) + Number(deliveryFee)).toFixed(2)),
        
        deliveryFee: parseFloat(Number(deliveryFee).toFixed(2)),
        deliveryDistance: parseFloat(Number(deliveryDistance).toFixed(2)),
        notes: `GCash Ref: ${gcashReference.trim()}`,
        gcashReferenceNumber: gcashReference.trim(),
        gcashProofImage: proofImagePath,
        deliveryAddress: deliveryAddress.trim()
      };
      
      console.log("📦 Sending order data:", JSON.stringify(orderData, null, 2));
      console.log("📍 Customer location being sent:", orderData.customer.location); // ✅ ADD THIS LOG
      console.log("🔢 Total calculation:", {
        cartTotal: Number(cartTotal),
        deliveryFee: Number(deliveryFee),
        sum: Number(cartTotal) + Number(deliveryFee),
        final: parseFloat((Number(cartTotal) + Number(deliveryFee)).toFixed(2))
      });
      
      const apiUrl = import.meta.env.MODE === "development" 
        ? "http://localhost:5000/api/orders" 
        : "/api/orders";
      
      const response = await axios.post(apiUrl, orderData, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });
      
      console.log("✅ Order created successfully:", response.data);
      
      // Reset states
      setCart([]);
      setShowPaymentModal(false);
      setDeliveryAddress("");
      setDeliveryCoordinates(null);
      setDeliveryFee(50);
      setDeliveryDistance(0);
      setGcashReference("");
      setProofImage(null);
      setProofImagePreview(null);
      
      Swal.fire({
        title: "Order Placed!",
        text: "Your order has been successfully placed.",
        icon: "success",
        confirmButtonText: "View Orders",
        confirmButtonColor: "#3B82F6",
        background: "rgba(255, 255, 255, 0.9)",
        backdrop: `rgba(59, 130, 246, 0.4)`
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/customer-orders");
        } else {
          navigate("/customer-dashboard");
        }
      });
      
    } catch (error) {
      console.error("❌ Error placing order:", error);
      console.error("❌ Error response:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to place order. Please try again.";
      
      toast.error(errorMessage);
      
      if (error.response?.data?.errors) {
        console.error("❌ Validation errors:", error.response.data.errors);
      }
    } finally {
      setIsProcessingOrder(false);
    }
  };

  if (!showPaymentModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-2 my-2 md:my-0 max-h-[95vh] overflow-y-auto">
        <div className="p-3 md:p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-3 md:mb-4 sticky top-0 bg-white pt-1 pb-2 border-b z-10">
            <h2 className="text-base md:text-xl font-bold text-gray-900">Complete Your Order</h2>
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Address Autocomplete */}
          <div className="mb-4">
            <AddressAutocomplete 
              onAddressSelect={handleAddressSelect}
              initialAddress={user?.address}
              placeholder="Search your delivery address..."
            />
          </div>

          {/* Map Display */}
          <div className="mb-4">
            <AddressPickerMap 
              coordinates={deliveryCoordinates}
              selectedAddress={deliveryAddress}
            />
          </div>

          {/* ✅ NEW: Delivery Info Card */}
          {deliveryCoordinates && deliverySettings && (
            <div className="mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Delivery Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Distance:</span>
                  <span className="font-bold text-blue-900">{deliveryDistance.toFixed(2)} km</span>
                </div>
                {deliveryFee === 0 ? (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-2 text-center">
                    <span className="text-green-800 font-bold">🎉 FREE DELIVERY!</span>
                    <p className="text-xs text-green-700 mt-1">
                      Your order total is ₱{cartTotal.toFixed(2)} (≥ ₱{deliverySettings.freeDeliveryThreshold})
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Base Rate:</span>
                      <span className="text-blue-900">₱{deliverySettings.baseRate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Distance Charge:</span>
                      <span className="text-blue-900">
                        ₱{(deliveryDistance * deliverySettings.perKmRate).toFixed(2)}
                      </span>
                    </div>
                    {cartTotal >= deliverySettings.freeDeliveryThreshold * 0.8 && (
                      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-2 text-center text-xs">
                        💡 Add ₱{(deliverySettings.freeDeliveryThreshold - cartTotal).toFixed(2)} more for FREE delivery!
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Delivery Address */}
          <div className="mb-3 md:mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Delivery Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
              rows="2"
              placeholder="Enter your complete delivery address"
              required
            />
          </div>

          {/* GCash Payment Section */}
          <div className="border rounded-md p-3 md:p-4 mb-3 md:mb-4 bg-blue-50">
            <div className="flex items-center mb-3">
              <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-medium text-blue-900 text-sm md:text-base">GCash Payment</h3>
            </div>
            
            <p className="text-xs md:text-sm text-gray-600 mb-3">
              Please send your payment to: <br />
              <span className="font-medium text-blue-900">0912 345 6789</span> (CafeX Official)
            </p>

            <div className="mb-3">
              <label className="block text-gray-700 text-xs md:text-sm font-medium mb-1">
                GCash Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={gcashReference}
                onChange={(e) => setGcashReference(e.target.value)}
                className="w-full px-2 md:px-3 py-1 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Enter GCash reference number"
                required
              />
            </div>

            <div className="mb-2">
              <label className="block text-gray-700 text-xs md:text-sm font-medium mb-1">
                Proof of Payment <span className="text-red-500">*</span>
              </label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-md p-3 text-center cursor-pointer hover:bg-gray-50"
                onClick={() => fileInputRef.current.click()}
              >
                {proofImagePreview ? (
                  <div className="relative">
                    <img 
                      src={proofImagePreview} 
                      alt="Payment proof" 
                      className="max-h-36 md:max-h-48 mx-auto rounded-md"
                    />
                    <button 
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProofImage(null);
                        setProofImagePreview(null);
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <Upload className="mx-auto h-6 w-6 md:h-8 md:w-8 text-gray-400 mb-1 md:mb-2" />
                    <p className="text-xs md:text-sm">Click to upload screenshot/photo</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG or WEBP</p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                />
              </div>
            </div>
          </div>

          {/* ✅ UPDATED: Order Total with dynamic delivery fee */}
          <div className="mb-3 md:mb-4 pt-2 border-t">
            <div className="flex justify-between text-gray-700 text-sm md:text-base">
              <span>Subtotal:</span>
              <span>₱{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700 text-sm md:text-base pt-1">
              <span>Delivery Fee:</span>
              {isCalculatingFee ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-1" />
                  Calculating...
                </span>
              ) : (
                <span className={deliveryFee === 0 ? "text-green-600 font-bold" : ""}>
                  {deliveryFee === 0 ? "FREE" : `₱${deliveryFee.toFixed(2)}`}
                </span>
              )}
            </div>
            <div className="flex justify-between font-bold text-base md:text-lg pt-2">
              <span>Total:</span>
              <span>₱{(cartTotal + deliveryFee).toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={submitOrder}
            disabled={isProcessingOrder || isCalculatingFee || !deliveryCoordinates}
            className="w-full bg-blue-600 text-white py-2 md:py-3 rounded-md font-semibold hover:bg-blue-700 flex items-center justify-center text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessingOrder ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Place Order (₱{(cartTotal + deliveryFee).toFixed(2)})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;