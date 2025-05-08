import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import CustomerSideNav from "../../pages/customer/customerSideNav";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Plus, Minus, Trash2, Coffee, CreditCard, Truck, Upload, X, Check } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import Swal from "sweetalert2"; // Add this import if it's not already there

const CustomerBuy = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Coffee");
  const [categories, setCategories] = useState([
    "Coffee", 
    "Tea", 
    "Pastry", 
    "Sandwich", 
    "Dessert", 
    "Other"
  ]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [gcashReference, setGcashReference] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [proofImagePreview, setProofImagePreview] = useState(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const fileInputRef = useRef(null);

  // Define API base URL for images
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

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = import.meta.env.MODE === "development" 
          ? "http://localhost:5000/api/products" 
          : "/api/products";
        const response = await axios.get(apiUrl);
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load menu items");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products by category
  const filteredProducts = products.filter(
    (product) => product.category === activeCategory
  );

  // Add to cart
  const addToCart = (product) => {
    const existingItem = cart.find(item => item._id === product._id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item._id === product._id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    toast.success(`Added ${product.name} to cart`);
  };

  // Update quantity
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }
    
    setCart(cart.map(item => 
      item._id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  // Remove from cart
  const removeFromCart = (id) => {
    setCart(cart.filter(item => item._id !== id));
    toast.success("Item removed from cart");
  };

  // Calculate total
  const cartTotal = cart.reduce((total, item) => 
    total + (item.price * item.quantity), 0
  );

  // Open payment modal
  const openPaymentModal = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    
    if (!user) {
      toast.error("Please log in to place an order");
      navigate("/costumerLogin");
      return;
    }
    
    // Pre-fill address if user is logged in
    if (user) {
      setDeliveryAddress(user.address || "");
    }
    
    setShowPaymentModal(true);
  };

  // Handle file input
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

  // Upload proof image
  const uploadProofImage = async () => {
    if (!proofImage) return "";
    
    const formData = new FormData();
    formData.append('image', proofImage);
    
    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      return response.data.imagePath;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload proof of payment image");
    }
  };

  // Submit order
  const submitOrder = async () => {
    try {
      setIsProcessingOrder(true);
      
      // Validate required fields
      if (!deliveryAddress.trim()) {
        toast.error("Please enter a delivery address");
        setIsProcessingOrder(false);
        return;
      }
      
      // For GCash, validate reference number and proof image
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
      
      // Upload proof image first if needed
      let imagePath = "";
      if (paymentMethod === "GCash" && proofImage) {
        imagePath = await uploadProofImage();
      }
      
      // Map the payment method to one of the allowed enum values in the backend
      let orderPaymentMethod = "Cash";
      if (paymentMethod === "GCash") {
        orderPaymentMethod = "Online Payment";
      } else if (paymentMethod === "Cash on Delivery") {
        orderPaymentMethod = "Cash";
      }
      
      // Create order object with only the fields the backend expects
      const orderData = {
        customer: {
          name: user?.name || "Guest",
          email: user?.email || "guest@example.com",
          phone: user?.phone || ""
        },
        items: cart.map(item => ({
          product: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        notes: `Delivery Address: ${deliveryAddress}${paymentMethod === "GCash" ? `, GCash Ref: ${gcashReference}` : ""}`,
        paymentMethod: orderPaymentMethod,
        total: cartTotal
      };
      
      console.log("Order data being sent:", orderData);
      
      // Send order to server with authentication
      const response = await axios.post("/api/orders", orderData, {
        withCredentials: true  // Ensure cookies are sent for authentication
      });
      
      console.log("Order response:", response.data);
      
      // Reset states
      setCart([]);
      setShowPaymentModal(false);
      setPaymentMethod("Cash on Delivery");
      setDeliveryAddress("");
      setGcashReference("");
      setProofImage(null);
      setProofImagePreview(null);
      
      // Show SweetAlert for order success
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
      console.error("Error placing order:", error);
      toast.error(error.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setIsProcessingOrder(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 relative">
      {/* Sidebar */}
      <CustomerSideNav />

      {/* Main Content */}
      <main className={`flex-1 bg-white ${isMobile ? 'pb-20' : 'pb-0'}`}>
        {/* Category Navigation */}
        <div className="border-t border-b border-orange-300 sticky top-0 bg-white z-10">
          <div className="container mx-auto px-4">
            <nav className="flex overflow-x-auto py-4 space-x-4 no-scrollbar">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`whitespace-nowrap text-sm md:text-lg font-medium transition-colors px-3 py-1 rounded-full ${
                    activeCategory === category
                      ? "bg-blue-100 text-blue-900 font-semibold"
                      : "text-gray-600 hover:text-blue-800 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Products Section */}
            <div className="lg:w-2/3">
              <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-6">{activeCategory}</h2>

              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No products available in this category.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="flex flex-row">
                        <div className="w-1/3 h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <img
                              src={`${API_BASE_URL}${product.image}`}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Coffee className="h-12 w-12 text-gray-400" />
                          )}
                        </div>
                        <div className="w-2/3 p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-0.5 rounded">
                              ₱{product.price.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                          <button 
                            onClick={() => addToCart(product)}
                            className="mt-2 bg-blue-600 text-white px-3 py-1 rounded-md flex items-center text-sm hover:bg-blue-700"
                            disabled={product.stock <= 0}
                          >
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Section */}
            <div className="lg:w-1/3 mt-6 lg:mt-0">
              <div className="bg-white rounded-lg shadow-md p-4 md:p-6 sticky top-20">
                <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Your Cart
                </h2>
                
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">Your cart is empty</p>
                ) : (
                  <>
                    <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item._id} className="py-3 flex justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-gray-600">₱{item.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-sm">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => removeFromCart(item._id)}
                              className="p-1 rounded-full bg-red-100 text-red-500 hover:bg-red-200 ml-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between font-bold text-lg mb-4">
                        <span>Total:</span>
                        <span>₱{cartTotal.toFixed(2)}</span>
                      </div>
                      <button 
                        onClick={openPaymentModal}
                        className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 flex items-center justify-center"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Checkout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Complete Your Order</h2>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Delivery Address */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Delivery Address
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Enter your complete delivery address"
                  required
                />
              </div>

              {/* Payment Method Selection */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Payment Method
                </label>
                <div className="space-y-2">
                  <div 
                    className={`p-3 border rounded-md cursor-pointer flex items-center ${
                      paymentMethod === "Cash on Delivery" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-300 hover:border-blue-300"
                    }`}
                    onClick={() => setPaymentMethod("Cash on Delivery")}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                      paymentMethod === "Cash on Delivery" ? "border-blue-500" : "border-gray-400"
                    }`}>
                      {paymentMethod === "Cash on Delivery" && (
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Cash on Delivery</div>
                      <div className="text-sm text-gray-500">Pay when your order arrives</div>
                    </div>
                    <Truck className="w-5 h-5 text-gray-400" />
                  </div>

                  <div 
                    className={`p-3 border rounded-md cursor-pointer flex items-center ${
                      paymentMethod === "GCash" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-300 hover:border-blue-300"
                    }`}
                    onClick={() => setPaymentMethod("GCash")}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                      paymentMethod === "GCash" ? "border-blue-500" : "border-gray-400"
                    }`}>
                      {paymentMethod === "GCash" && (
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">GCash</div>
                      <div className="text-sm text-gray-500">Pay via GCash mobile payment</div>
                    </div>
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* GCash Details (Conditional) */}
              {paymentMethod === "GCash" && (
                <div className="border rounded-md p-4 mb-4 bg-blue-50">
                  <h3 className="font-medium text-blue-900 mb-2">GCash Payment Details</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Please send your payment to: <br />
                    <span className="font-medium">0912 345 6789</span> (CafeX Official)
                  </p>

                  <div className="mb-3">
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={gcashReference}
                      onChange={(e) => setGcashReference(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter GCash reference number"
                    />
                  </div>

                  <div className="mb-2">
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Proof of Payment
                    </label>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:bg-gray-50"
                      onClick={() => fileInputRef.current.click()}
                    >
                      {proofImagePreview ? (
                        <div className="relative">
                          <img 
                            src={proofImagePreview} 
                            alt="Payment proof" 
                            className="max-h-48 mx-auto rounded-md"
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
                          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm">Click to upload screenshot/photo</p>
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
              )}

              {/* Order Total */}
              <div className="mb-4 pt-2 border-t">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>₱{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700 pt-1">
                  <span>Delivery Fee:</span>
                  <span>₱50.00</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total:</span>
                  <span>₱{(cartTotal + 50).toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={submitOrder}
                disabled={isProcessingOrder}
                className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 flex items-center justify-center"
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
      )}
    </div>
  );
};

export default CustomerBuy;