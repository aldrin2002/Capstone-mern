import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import CustomerSideNav, { MOBILE_NAV_HEIGHT } from "../../pages/customer/customerSideNav";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Plus, Minus, Trash2, Coffee, CreditCard, Truck, Upload, X, Check, ShoppingBag, Star, Sparkles, Zap, Filter } from "lucide-react";
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

  // Get category icon
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Coffee': return <Coffee className="h-5 w-5" />;
      case 'Tea': return <Sparkles className="h-5 w-5" />;
      case 'Pastry': return <Star className="h-5 w-5" />;
      case 'Sandwich': return <Zap className="h-5 w-5" />;
      case 'Dessert': return <Star className="h-5 w-5" />;
      default: return <Filter className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/15 to-purple-500/15 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-pink-400/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-gradient-to-br from-purple-400/8 to-blue-400/8 rounded-full blur-3xl animate-pulse-slow"></div>
        
        {/* Floating sparkles */}
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-twinkle"></div>
        <div className="absolute top-40 right-1/3 w-1 h-1 bg-purple-400 rounded-full opacity-40 animate-twinkle-delayed"></div>
        <div className="absolute bottom-32 left-1/3 w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-50 animate-twinkle"></div>
      </div>

      {/* Sidebar */}
      <CustomerSideNav />

      {/* Main Content - Adjusted for fixed sidebar */}
      <main className={`relative z-10 ${isMobile ? 'pb-20' : 'ml-64 pb-0'}`}>
        {/* Enhanced Category Navigation with Cart Button */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 z-30 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          
          <div className="relative container mx-auto px-4 py-4 md:py-6">
            <div className="flex items-center justify-between">
              {/* Enhanced Categories */}
              <nav className="flex overflow-x-auto pb-2 hide-scrollbar space-x-3 md:space-x-4 flex-1">
                {categories.map((category, index) => (
                  <button
                    key={category}
                    className={`group flex items-center justify-center px-4 py-2.5 md:px-6 md:py-3 whitespace-nowrap text-sm md:text-base font-semibold rounded-xl md:rounded-2xl transition-all duration-500 transform hover:scale-105 relative overflow-hidden min-w-0 flex-shrink-0 ${
                      activeCategory === category
                        ? "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-xl shadow-blue-500/25"
                        : "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-lg border border-gray-200/50 hover:border-blue-300/50"
                    }`}
                    onClick={() => setActiveCategory(category)}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Button glow effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl md:rounded-2xl ${
                      activeCategory === category ? 'opacity-100' : ''
                    }`}></div>
                    
                    {/* Icon */}
                    <span className="relative mr-2 transition-transform duration-300 group-hover:scale-110">
                      {getCategoryIcon(category)}
                    </span>
                    
                    {/* Text */}
                    <span className="relative font-bold tracking-wide">
                      {category}
                    </span>
                    
                    {/* Product count badge */}
                    <div className={`relative ml-1.5 md:ml-3 px-2 md:px-3 py-0.5 md:py-1 text-xs font-bold rounded-full transition-all duration-300 flex items-center justify-center ${
                      activeCategory === category
                        ? "bg-white/20 text-white border border-white/30"
                        : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700 border border-gray-200"
                    }`}>
                      {products.filter(p => p.category === category).length}
                    </div>
                  </button>
                ))}
              </nav>
              
              {/* Enhanced Cart Button - Mobile: Inline with categories, Desktop: Fixed */}
              {isMobile ? (
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => setShowCartModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 relative group"
                  >
                    <div className="relative">
                      <ShoppingCart className="w-6 h-6" />
                      {cart.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse font-bold shadow-lg">
                          {cart.reduce((total, item) => total + item.quantity, 0)}
                        </span>
                      )}
                    </div>
                    
                    {/* Ripple effect */}
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              ) : (
                /* Enhanced Desktop: Fixed position cart button */
                <div className="fixed bottom-6 right-6 z-40">
                  <button
                    onClick={() => setShowCartModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-110 group relative overflow-hidden"
                  >
                    {/* Background animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative flex items-center">
                      <ShoppingCart className="w-6 h-6 mr-2" />
                      <span className="font-semibold">Cart</span>
                      {cart.length > 0 && (
                        <span className="ml-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-full h-6 w-6 flex items-center justify-center animate-bounce font-bold shadow-lg">
                          {cart.reduce((total, item) => total + item.quantity, 0)}
                        </span>
                      )}
                    </div>
                    
                    {/* Hover tooltip */}
                    {cart.length > 0 && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <div className="bg-black/90 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-xl whitespace-nowrap shadow-xl border border-white/10">
                          {cart.length} item{cart.length > 1 ? 's' : ''} • ₱{cartTotal.toFixed(2)}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Products Section */}
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Enhanced Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 space-y-6 lg:space-y-0">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                  <div className="text-white">
                    {getCategoryIcon(activeCategory)}
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
                  {activeCategory}
                </h2>
              </div>
              <p className="text-gray-600 text-lg">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} available
              </p>
            </div>
            
            {/* Featured count badge if any */}
            {filteredProducts.some(product => product.featured) && (
              <div className="group">
                <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 rounded-2xl border-2 border-amber-200/50 hover:border-amber-300/50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                  <Star className="h-5 w-5 text-amber-600 mr-3 group-hover:rotate-12 transition-transform duration-300" fill="currentColor" />
                  <span className="text-sm font-bold text-amber-800">
                    {filteredProducts.filter(product => product.featured).length} Featured Item{filteredProducts.filter(product => product.featured).length !== 1 ? 's' : ''}
                  </span>
                  <div className="ml-2 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="relative mb-8">
                  {/* Enhanced loading animation */}
                  <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto shadow-lg"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <ShoppingCart className="h-8 w-8 text-blue-600 animate-pulse" />
                  </div>
                  {/* Outer ring */}
                  <div className="absolute inset-0 w-20 h-20 border-2 border-purple-300 rounded-full animate-ping mx-auto opacity-30"></div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Loading Products</h3>
                <p className="text-gray-600 text-lg">Preparing delicious items...</p>
                <div className="flex justify-center space-x-1 mt-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-24">
              <div className="max-w-lg mx-auto">
                <div className="relative mb-12">
                  {/* Enhanced empty state illustration */}
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto shadow-2xl border-4 border-white">
                    <ShoppingCart className="h-14 w-14 text-gray-400" />
                  </div>
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-xl animate-bounce-gentle">
                    <Coffee size={24} className="text-white" />
                  </div>
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Sparkles size={16} className="text-white" />
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent mb-6">No Products Available</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  No products available in the {activeCategory} category at the moment. Try exploring other categories!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {filteredProducts.map((product, index) => (
                <div
                  key={product._id}
                  className="group bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden transform transition-all duration-700 hover:scale-[1.03] hover:shadow-2xl border border-white/60 hover:border-blue-300/60 animate-fade-in-up relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Card glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                  
                  {/* Enhanced Product Image */}
                  <div className="relative h-48 md:h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {product.image ? (
                      <img
                        src={`${API_BASE_URL}${product.image}`}
                        alt={product.name}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Coffee className="h-16 w-16 text-gray-400 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    )}
                    
                    {/* Enhanced featured badge */}
                    {product.featured && (
                      <div className="absolute top-4 right-4 group-hover:scale-110 transition-transform duration-300">
                        <div className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full shadow-xl backdrop-blur-sm border-2 border-white/30 hover:from-amber-600 hover:to-yellow-600">
                          <Star className="h-4 w-4 mr-2 animate-spin-slow" fill="currentColor" />
                          <span className="text-xs font-bold tracking-wide">POPULAR</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Enhanced price overlay */}
                    <div className="absolute bottom-4 left-4">
                      <div className="px-4 py-2 bg-black/80 backdrop-blur-sm text-white text-lg font-bold rounded-full shadow-xl border border-white/20 group-hover:scale-105 transition-transform duration-300">
                        ₱{product.price.toFixed(2)}
                      </div>
                    </div>

                    {/* Stock indicator */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-lg ${
                        product.stock > 5 
                          ? "bg-green-500/90 text-white" 
                          : product.stock > 0 
                            ? "bg-orange-500/90 text-white" 
                            : "bg-red-500/90 text-white"
                      }`}>
                        {product.stock > 5 ? "In Stock" : product.stock > 0 ? `${product.stock} left` : "Out of Stock"}
                      </span>
                    </div>
                    
                    {/* Corner decoration */}
                    <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  
                  {/* Enhanced Product Info */}
                  <div className="p-6 relative">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors duration-300 group-hover:scale-105 transform transition-transform duration-300">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                        {product.description}
                      </p>
                    </div>
                    
                    {/* Enhanced Add to Cart Button */}
                    <button 
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className={`w-full py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-lg hover:shadow-xl text-base relative overflow-hidden group ${
                        product.stock > 0 
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white" 
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {/* Button background effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <ShoppingCart className="w-5 h-5 mr-2 relative" />
                      <span className="relative">
                        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </span>
                      
                      {/* Ripple effect */}
                      {product.stock > 0 && (
                        <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
                      )}
                    </button>
                    
                    {/* Decorative elements */}
                    <div className="absolute bottom-2 right-2 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {/* Enhanced custom animations and styles */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(2deg);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(-1deg);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.2;
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        @keyframes twinkle-delayed {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
        
        .animate-twinkle-delayed {
          animation: twinkle-delayed 4s ease-in-out infinite 1s;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 3s ease-in-out infinite;
        }
        
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default CustomerBuy;