import { useMemo, useState, useEffect } from "react";
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

const PRODUCTS_API_URL = import.meta.env.MODE === "development"
  ? "http://localhost:5000/api/products"
  : "/api/products";

const CATEGORIES_API_URL = import.meta.env.MODE === "development"
  ? "http://localhost:5000/api/categories"
  : "/api/categories";

const CustomerBuy = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Coffee");
  const [dbCategories, setDbCategories] = useState([]);
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
        const response = await axios.get(PRODUCTS_API_URL);
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

  // Fetch categories (public)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(CATEGORIES_API_URL);
        setDbCategories(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Merge DB categories with any categories found in products (fallback)
  const categories = useMemo(() => {
    const fromDb = (dbCategories || []).map((c) => c?.name).filter(Boolean);
    const merged = [...fromDb];
    const seen = new Set(fromDb);

    for (const product of products || []) {
      const name = product?.category;
      if (name && !seen.has(name)) {
        merged.push(name);
        seen.add(name);
      }
    }

    return merged;
  }, [dbCategories, products]);

  // Ensure activeCategory is always valid
  useEffect(() => {
    if (!categories.length) return;
    if (!activeCategory || !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // Filter products by category
  const filteredProducts = activeCategory
    ? products.filter((product) => product.category === activeCategory)
    : products;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-100 to-primary-200 relative overflow-hidden">
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