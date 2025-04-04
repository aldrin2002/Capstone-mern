import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import CustomerSideNav from "../../pages/customer/customerSideNav";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Plus, Minus, Trash2, Coffee } from "lucide-react";

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
        const response = await axios.get("http://localhost:5000/api/products");
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

  // Checkout function
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      // Here you would typically send the order to your backend
      await axios.post("http://localhost:5000/api/orders", {
        customer: user._id,
        items: cart.map(item => ({
          product: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        total: cartTotal
      });
      
      toast.success("Order placed successfully!");
      setCart([]);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
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
                              src={`http://localhost:5000${product.image}`}
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
                        onClick={handleCheckout}
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
    </div>
  );
};

export default CustomerBuy;
