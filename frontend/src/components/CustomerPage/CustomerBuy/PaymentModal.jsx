import React, { useState, useRef } from 'react';
import { X, Truck, CreditCard, Upload, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

const PaymentModal = ({ 
  showPaymentModal, 
  setShowPaymentModal, 
  cart, 
  setCart, 
  cartTotal, 
  user, 
  navigate 
}) => {
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || "");
  const [gcashReference, setGcashReference] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [proofImagePreview, setProofImagePreview] = useState(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const fileInputRef = useRef(null);

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
        withCredentials: true
      });
      
      console.log("Upload response:", response.data);
      
      // Return the Cloudinary URL instead of local path
      return response.data.imagePath || "";
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      toast.error("Failed to upload proof of payment. Please try again.");
      throw new Error("Failed to upload proof of payment image");
    }
  };

  const submitOrder = async () => {
    try {
      setIsProcessingOrder(true);
      
      console.log("🛒 Cart data:", cart);
      console.log("👤 User data:", user);
      console.log("💰 Cart total:", cartTotal);
      
      if (!deliveryAddress.trim()) {
        toast.error("Please enter a delivery address");
        setIsProcessingOrder(false);
        return;
      }
      
      if (paymentMethod === "GCash") {
        if (!gcashReference.trim()) {
          toast.error("Please enter GCash reference number");
          setIsProcessingOrder(false);
          return;
        }
        
        if (!proofImage) {
          toast.error("Please upload proof of payment");
          setIsProcessingOrder(false);
          return;
        }
      }
      
      let proofImagePath = "";
      if (paymentMethod === "GCash" && proofImage) {
        try {
          proofImagePath = await uploadProofImage();
          console.log("📸 Proof image uploaded:", proofImagePath);
        } catch (uploadError) {
          console.error("Error uploading proof:", uploadError);
          toast.error("Failed to upload proof of payment. Please try again.");
          setIsProcessingOrder(false);
          return;
        }
      }
      
      // Build order data with proper structure
      const orderData = {
        customer: {
          name: user?.name || "Guest",
          email: user?.email || "guest@example.com",
          phone: user?.phone || ""
        },
        items: cart.map(item => ({
          product: item._id,
          name: item.name,
          quantity: Number(item.quantity),
          price: Number(item.price)
        })),
        total: Number(cartTotal + 50),
        status: "Pending",
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === "GCash" ? "Paid" : "Pending",
        deliveryAddress: "", // leave empty for consistency with your host project
        notes:
          paymentMethod === "GCash"
            ? `Delivery Address: ${deliveryAddress.trim()}, GCash Ref: ${gcashReference.trim()}`
            : `Delivery Address: ${deliveryAddress.trim()}`,
        gcashReference: paymentMethod === "GCash" ? gcashReference.trim() : "",
        proofOfPayment: proofImagePath || ""
      };
      
      console.log("📦 Sending order data:", JSON.stringify(orderData, null, 2));
      
      // Check if all required fields are present
      console.log("✅ Validation checks:");
      console.log("- Customer name:", orderData.customer.name);
      console.log("- Customer email:", orderData.customer.email);
      console.log("- Items count:", orderData.items.length);
      console.log("- Total:", orderData.total);
      
      // Validate each item
      orderData.items.forEach((item, index) => {
        console.log(`- Item ${index}:`, {
          product: item.product,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        });
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
      setPaymentMethod("Cash on Delivery");
      setDeliveryAddress("");
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
      console.error("❌ Error status:", error.response?.status);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to place order. Please try again.";
      
      toast.error(errorMessage);
      
      // If there are validation errors, log them
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-2 my-2 md:my-0 max-h-[90vh] overflow-y-auto">
        <div className="p-3 md:p-6">
          <div className="flex justify-between items-center mb-3 md:mb-4 sticky top-0 bg-white pt-1 pb-2 border-b">
            <h2 className="text-base md:text-xl font-bold text-gray-900">Complete Your Order</h2>
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Delivery Address */}
          <div className="mb-3 md:mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Delivery Address
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

          {/* Payment Method Selection */}
          <div className="mb-3 md:mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Payment Method
            </label>
            <div className="space-y-2">
              <div 
                className={`p-2 md:p-3 border rounded-md cursor-pointer flex items-center ${
                  paymentMethod === "Cash on Delivery" 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-300 hover:border-blue-300"
                }`}
                onClick={() => setPaymentMethod("Cash on Delivery")}
              >
                <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border flex items-center justify-center mr-2 ${
                  paymentMethod === "Cash on Delivery" ? "border-blue-500" : "border-gray-400"
                }`}>
                  {paymentMethod === "Cash on Delivery" && (
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-xs md:text-base">Cash on Delivery</div>
                  <div className="text-xs text-gray-500">Pay when your order arrives</div>
                </div>
                <Truck className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              </div>

              <div 
                className={`p-2 md:p-3 border rounded-md cursor-pointer flex items-center ${
                  paymentMethod === "GCash" 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-300 hover:border-blue-300"
                }`}
                onClick={() => setPaymentMethod("GCash")}
              >
                <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border flex items-center justify-center mr-2 ${
                  paymentMethod === "GCash" ? "border-blue-500" : "border-gray-400"
                }`}>
                  {paymentMethod === "GCash" && (
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-xs md:text-base">GCash</div>
                  <div className="text-xs text-gray-500">Pay via GCash mobile payment</div>
                </div>
                <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* GCash Details (Conditional) */}
          {paymentMethod === "GCash" && (
            <div className="border rounded-md p-3 md:p-4 mb-3 md:mb-4 bg-blue-50">
              <h3 className="font-medium text-blue-900 mb-2 text-sm md:text-base">GCash Payment Details</h3>
              <p className="text-xs md:text-sm text-gray-600 mb-3">
                Please send your payment to: <br />
                <span className="font-medium">0912 345 6789</span> (CafeX Official)
              </p>

              <div className="mb-3">
                <label className="block text-gray-700 text-xs md:text-sm font-medium mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={gcashReference}
                  onChange={(e) => setGcashReference(e.target.value)}
                  className="w-full px-2 md:px-3 py-1 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter GCash reference number"
                />
              </div>

              <div className="mb-2">
                <label className="block text-gray-700 text-xs md:text-sm font-medium mb-1">
                  Proof of Payment
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
                      <p className="text-xs text-gray-400 mt-1 hidden md:block">JPG, PNG or WEBP</p>
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
          )}

          {/* Order Total */}
          <div className="mb-3 md:mb-4 pt-2 border-t">
            <div className="flex justify-between text-gray-700 text-sm md:text-base">
              <span>Subtotal:</span>
              <span>₱{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700 text-sm md:text-base pt-1">
              <span>Delivery Fee:</span>
              <span>₱50.00</span>
            </div>
            <div className="flex justify-between font-bold text-base md:text-lg pt-2">
              <span>Total:</span>
              <span>₱{(cartTotal + 50).toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={submitOrder}
            disabled={isProcessingOrder}
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
                Place Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;