import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import CustomerSideNav from "../../pages/customer/customerSideNav";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Plus, Minus, Trash2, Coffee, CreditCard, Truck, Upload, X, Check, ShoppingBag } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import Swal from "sweetalert2";

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
  
  // Cart Modal State
  const [showCartModal, setShowCartModal] = useState(false);
  
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

  // Add to cart - Auto open modal
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
    
    // Auto open cart modal after adding item
    setShowCartModal(true);
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

  // Open payment modal from cart modal
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
    
    setShowCartModal(false); // Close cart modal
    setShowPaymentModal(true); // Open payment modal
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

  // Update the uploadProofImage function to fix the 404 error
  const uploadProofImage = async () => {
    if (!proofImage) return "";
    
    const formData = new FormData();
    formData.append('image', proofImage);
    
    try {
      // Use the correct upload endpoint for orders
      const apiUrl = import.meta.env.MODE === "development" 
        ? "http://localhost:5000/api/orders/upload" 
        : "/api/orders/upload";
        
      console.log("Uploading to:", apiUrl);
      
      const response = await axios.post(apiUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      
      console.log("Upload response:", response.data);
      return response.data.imagePath || "";
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload proof of payment. Please try again.");
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
    
    // Upload proof image first if using GCash
    let proofImagePath = "";
    if (paymentMethod === "GCash" && proofImage) {
      try {
        proofImagePath = await uploadProofImage();
        console.log("Uploaded proof image path:", proofImagePath);
      } catch (uploadError) {
        console.error("Error uploading proof:", uploadError);
        toast.error("Failed to upload proof of payment. Please try again.");
        setIsProcessingOrder(false);
        return;
      }
    }
    
    // Map payment method to backend enum value
    let orderPaymentMethod = "Cash";
    if (paymentMethod === "GCash") {
      orderPaymentMethod = "Online Payment";
    }
    
    // Create the order data object
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
      total: cartTotal + 50, // Include delivery fee
      proofOfPayment: proofImagePath || "" // Include the image path from separate upload
    };
    
    // Set the API URL based on environment
    const apiUrl = import.meta.env.MODE === "development" 
      ? "http://localhost:5000/api/orders" 
      : "/api/orders";
    
    // Send order data as JSON
    const response = await axios.post(apiUrl, orderData, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true
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
    
    // Show success message
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
        {/* Category Navigation with Cart Button */}
        <div className="border-t border-b border-orange-300 sticky top-0 bg-white z-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              {/* Categories */}
              <nav className="flex overflow-x-auto py-4 space-x-4 no-scrollbar flex-1">
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
              
              {/* Cart Button - Mobile: Inline with categories, Desktop: Fixed */}
              {isMobile ? (
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => setShowCartModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 relative"
                  >
                    <div className="relative">
                      <ShoppingCart className="w-8 h-8" />
                      {cart.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse font-bold">
                          {cart.reduce((total, item) => total + item.quantity, 0)}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              ) : (
                /* Desktop: Fixed position cart button */
                <div className="fixed bottom-6 right-6 z-40">
                  <button
                    onClick={() => setShowCartModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group relative"
                  >
                    <div className="relative">
                      <ShoppingCart className="w-6 h-6" />
                      {cart.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse font-bold">
                          {cart.reduce((total, item) => total + item.quantity, 0)}
                        </span>
                      )}
                    </div>
                    
                    {/* Cart preview tooltip on hover */}
                    {cart.length > 0 && (
                      <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <div className="bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {cart.length} item{cart.length > 1 ? 's' : ''} • ₱{cartTotal.toFixed(2)}
                        </div>
                        <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="container mx-auto px-4 py-6">
          <div className="w-full">
            <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-6">{activeCategory}</h2>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No products available in this category.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                  >
                    {/* Product Image */}
                    <div className="h-40 md:h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden relative">
                      {product.image ? (
                        <img
                          src={`${API_BASE_URL}${product.image}`}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <Coffee className="h-12 w-12 md:h-16 md:w-16 text-gray-400" />
                      )}
                      {/* Price Badge */}
                      <div className="absolute top-2 md:top-3 right-2 md:right-3 bg-blue-600 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold shadow-lg">
                        ₱{product.price.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Product Details */}
                    <div className="p-4 md:p-5">
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 line-clamp-1">{product.name}</h3>
                      <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-2 h-8 md:h-10">{product.description}</p>
                      
                      {/* Add to Cart Button */}
                      <button 
                        onClick={() => addToCart(product)}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 md:py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105 text-sm md:text-base"
                        disabled={product.stock <= 0}
                      >
                        <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Enhanced Responsive Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm md:max-w-md max-h-[90vh] overflow-hidden mx-2 md:mx-0">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 md:p-6 relative">
              <button 
                onClick={() => setShowCartModal(false)}
                className="absolute top-3 md:top-4 right-3 md:right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1.5 md:p-2 transition-all duration-200"
              >
                <X size={18} className="md:w-5 md:h-5" />
              </button>
              <div className="flex items-center">
                <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                <h2 className="text-lg md:text-xl font-bold">Your Cart</h2>
              </div>
              <p className="text-blue-100 text-xs md:text-sm mt-1">
                {cart.length === 0 ? "No items yet" : `${cart.reduce((total, item) => total + item.quantity, 0)} items`}
              </p>
            </div>

            {/* Cart Content */}
            <div className="flex flex-col max-h-[calc(90vh-160px)] md:max-h-[calc(90vh-200px)]">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 md:py-12 px-4 md:px-6">
                  <ShoppingCart className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mb-3 md:mb-4" />
                  <p className="text-gray-500 text-center text-sm md:text-base">Your cart is empty</p>
                  <p className="text-gray-400 text-xs md:text-sm text-center mt-1 md:mt-2">Add some delicious items to get started!</p>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="space-y-3 md:space-y-4">
                      {cart.map((item) => (
                        <div key={item._id} className="flex items-center bg-gray-50 rounded-xl p-3 md:p-4 hover:bg-gray-100 transition-colors">
                          {/* Item Image */}
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden mr-3 md:mr-4 flex-shrink-0">
                            {item.image ? (
                              <img
                                src={`${API_BASE_URL}${item.image}`}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Coffee className="w-4 h-4 md:w-6 md:h-6 text-gray-400" />
                            )}
                          </div>
                          
                          {/* Item Details */}
                          <div className="flex-1 min-w-0 mr-2">
                            <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">{item.name}</h3>
                            <p className="text-blue-600 font-bold text-sm md:text-base">₱{item.price.toFixed(2)}</p>
                          </div>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                            <button 
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="p-1 md:p-1.5 rounded-full bg-white border border-gray-300 hover:bg-red-50 hover:border-red-300 transition-colors"
                            >
                              <Minus className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-600" />
                            </button>
                            <span className="w-6 md:w-8 text-center font-semibold text-sm md:text-base">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="p-1 md:p-1.5 rounded-full bg-white border border-gray-300 hover:bg-green-50 hover:border-green-300 transition-colors"
                            >
                              <Plus className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-600" />
                            </button>
                            <button 
                              onClick={() => removeFromCart(item._id)}
                              className="p-1 md:p-1.5 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors ml-1 md:ml-2"
                            >
                              <Trash2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cart Footer */}
                  <div className="border-t bg-gray-50 p-4 md:p-6">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center mb-1 md:mb-2">
                      <span className="text-gray-600 text-sm md:text-base">Subtotal:</span>
                      <span className="font-semibold text-sm md:text-base">₱{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-3 md:mb-4">
                      <span className="text-gray-600 text-sm md:text-base">Delivery Fee:</span>
                      <span className="font-semibold text-sm md:text-base">₱50.00</span>
                    </div>
                    <div className="flex justify-between items-center mb-4 md:mb-6 text-base md:text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-blue-600">₱{(cartTotal + 50).toFixed(2)}</span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2 md:space-y-3">
                      <button 
                        onClick={openPaymentModal}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 md:py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 text-sm md:text-base"
                      >
                        <Check className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        Proceed to Checkout
                      </button>
                      <button 
                        onClick={() => setShowCartModal(false)}
                        className="w-full bg-gray-200 text-gray-700 py-2.5 md:py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors text-sm md:text-base"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentModal && (
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
                className="w-full bg-blue-600 text-white py-2 md:py-3 rounded-md font-semibold hover:bg-blue-700 flex items-center justify-center text-sm md:text-base"
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