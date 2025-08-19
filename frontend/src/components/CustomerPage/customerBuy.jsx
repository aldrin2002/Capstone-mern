import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import CustomerSideNav from "../../pages/customer/customerSideNav";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

// Import sub-components
import CategoryNavigation from "./CustomerBuy/CategoryNavigation";
import ProductsSection from "./CustomerBuy/ProductsSection";
import CartModal from "./CustomerBuy/CartModal";
import PaymentModal from "./CustomerBuy/PaymentModal";
import BackgroundElements from "./CustomerBuy/BackgroundElements";
import CustomStyles from "./CustomerBuy/CustomStyles";

const CustomerBuy = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Coffee");
  const [categories] = useState([
    "Coffee",   
    "Tea", 
    "Pastry", 
    "Sandwich", 
    "Dessert", 
    "Other"
  ]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Modal States
  const [showCartModal, setShowCartModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuthStore();

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

  // Cart functions
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
    setShowCartModal(true);
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }
    
    setCart(cart.map(item => 
      item._id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item._id !== id));
    toast.success("Item removed from cart");
  };

  const cartTotal = cart.reduce((total, item) => 
    total + (item.price * item.quantity), 0
  );

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
    
    setShowCartModal(false);
    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <BackgroundElements />
      
      <CustomerSideNav />

      <main className={`relative z-10 ${isMobile ? 'pb-20' : 'ml-64 pb-0'}`}>
        <CategoryNavigation
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          cart={cart}
          setShowCartModal={setShowCartModal}
          isMobile={isMobile}
          cartTotal={cartTotal}
          products={products} // Add this line
        />

        <ProductsSection
          activeCategory={activeCategory}
          filteredProducts={filteredProducts}
          isLoading={isLoading}
          addToCart={addToCart}
          products={products}
        />
      </main>

      <CartModal
        showCartModal={showCartModal}
        setShowCartModal={setShowCartModal}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        cartTotal={cartTotal}
        openPaymentModal={openPaymentModal}
      />

      <PaymentModal
        showPaymentModal={showPaymentModal}
        setShowPaymentModal={setShowPaymentModal}
        cart={cart}
        setCart={setCart}
        cartTotal={cartTotal}
        user={user}
        navigate={navigate}
      />

      <CustomStyles />
    </div>
  );
};

export default CustomerBuy;