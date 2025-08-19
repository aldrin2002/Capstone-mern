import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import CustomerSideNav, { MOBILE_NAV_HEIGHT } from "../../pages/customer/customerSideNav";
import { useNavigate } from "react-router-dom";
import { Coffee, CheckCircle2, Star, Clock, ShoppingCart, Sparkles, Heart, Eye, ChefHat, Flame, Timer } from "lucide-react";

const CustomerMenu = () => {
  const [products, setProducts] = useState([]);
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

  // Get category icon
  const getCategoryIcon = (category) => {
    const iconMap = {
      Coffee: <Coffee className="h-4 w-4" />,
      Tea: <Coffee className="h-4 w-4" />,
      Pastry: <ChefHat className="h-4 w-4" />,
      Sandwich: <Coffee className="h-4 w-4" />,
      Dessert: <Star className="h-4 w-4" />,
      Other: <Sparkles className="h-4 w-4" />
    };
    return iconMap[category] || <Coffee className="h-4 w-4" />;
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
      <main className={`relative z-10 ${isMobile ? 'pb-20' : 'ml-64'}`}>
        {/* Enhanced Header Section */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <div 
              className="absolute inset-0 opacity-50" 
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            ></div>
          </div>
          
          {/* Enhanced floating decoration elements */}
          <div className="absolute top-8 right-8 w-20 h-20 border-2 border-white/20 rounded-full animate-spin-slow"></div>
          <div className="absolute top-16 right-24 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-12 left-12 w-16 h-16 border border-white/10 rounded-full animate-pulse-delayed"></div>
          <div className="absolute bottom-20 left-6 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce-gentle"></div>
          
          <div className="relative px-4 py-12 md:py-16">
            <div className="container mx-auto text-center">
              {/* Enhanced badge */}
              <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-lg rounded-full text-blue-200 text-sm font-medium mb-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300">
                <ChefHat className="h-4 w-4 mr-2 animate-pulse" />
                <Sparkles className="h-3 w-3 mr-2 text-yellow-300" />
                Discover Our Menu
              </div>
              
              {/* Enhanced title with gradient animation */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent animate-gradient-x bg-300% leading-tight">
                CAFE MENU
              </h1>
              
              <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed font-light">
                Explore our carefully curated selection of premium coffee, delicious treats, and artisan creations
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Category Navigation */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 z-30 shadow-lg">
          <div className="container mx-auto px-4 py-4 md:py-6">
            <nav className="flex overflow-x-auto pb-2 hide-scrollbar space-x-2 md:space-x-3">
              {categories.map((category, index) => (
                <button
                  key={category}
                  className={`group flex items-center justify-center px-4 py-2.5 md:px-6 md:py-3 whitespace-nowrap text-xs md:text-sm font-semibold rounded-xl md:rounded-2xl transition-all duration-500 transform hover:scale-105 relative overflow-hidden min-w-0 flex-shrink-0 ${
                    activeCategory === category
                      ? "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-xl shadow-blue-500/25"
                      : "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-lg border border-gray-200/50"
                  }`}
                  onClick={() => setActiveCategory(category)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Button glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl md:rounded-2xl ${
                    activeCategory === category ? 'opacity-100' : ''
                  }`}></div>
                  
                  {/* Icon container - better mobile alignment */}
                  <div className={`relative mr-2 md:mr-3 p-1 md:p-1.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                    activeCategory === category 
                      ? "bg-white/20" 
                      : "bg-gray-100 group-hover:bg-blue-100"
                  }`}>
                    <div className={`transition-colors duration-300 flex items-center justify-center ${
                      activeCategory === category 
                        ? "text-white" 
                        : "text-gray-600 group-hover:text-blue-600"
                    }`}>
                      {getCategoryIcon(category)}
                    </div>
                  </div>
                  
                  {/* Category name - hidden on very small screens, shown on larger mobile */}
                  <span className="relative hidden xs:inline sm:inline">{category}</span>
                  
                  {/* Enhanced category count badge - adjusted for mobile */}
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
          </div>
        </div>

        {/* Enhanced Menu Content */}
        <div className="container mx-auto px-4 py-12">
          {/* Enhanced Category Header */}
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
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="relative mb-8">
                  {/* Enhanced loading animation */}
                  <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto shadow-lg"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <ChefHat className="h-8 w-8 text-blue-600 animate-pulse" />
                  </div>
                  {/* Outer ring */}
                  <div className="absolute inset-0 w-20 h-20 border-2 border-purple-300 rounded-full animate-ping mx-auto opacity-30"></div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Loading Menu</h3>
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
                    <Coffee className="h-14 w-14 text-gray-400" />
                  </div>
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-xl animate-bounce-gentle">
                    <ChefHat size={24} className="text-white" />
                  </div>
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Sparkles size={16} className="text-white" />
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent mb-6">No items available</h3>
                <p className="text-gray-600 leading-relaxed text-lg mb-8">
                  Sorry, we don't have any {activeCategory.toLowerCase()} items available right now.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-16">
              {filteredProducts.map((product, index) => (
                <div
                  key={product._id}
                  className="group bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden transform transition-all duration-700 hover:scale-[1.03] hover:shadow-2xl border border-white/60 hover:border-blue-300/60 animate-fade-in-up relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Card glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                  
                  {/* Enhanced Product Image */}
                  <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
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
                    
                    {/* Enhanced Stock Status and Category */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        {product.stock > 5 && (
                          <div className="flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200">
                            <CheckCircle2 size={14} className="mr-1.5" />
                            <span className="font-medium">In Stock</span>
                          </div>
                        )}
                        {product.stock <= 5 && product.stock > 0 && (
                          <div className="flex items-center px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-200">
                            <Timer size={14} className="mr-1.5" />
                            <span className="font-medium">Only {product.stock} left</span>
                          </div>
                        )}
                        {product.stock === 0 && (
                          <div className="flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-full border border-red-200">
                            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                            <span className="font-medium">Out of stock</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Enhanced category tag */}
                      <span className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 rounded-full border border-blue-200">
                        {product.category}
                      </span>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute bottom-2 right-2 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

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
        
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
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
        
        @keyframes pulse-delayed {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
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
        
        .animate-gradient-x {
          animation: gradient-x 15s ease infinite;
          background-size: 300% 300%;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 3s ease-in-out infinite;
        }
        
        .animate-pulse-delayed {
          animation: pulse-delayed 2s ease-in-out infinite 0.5s;
        }
        
        .bg-300% {
          background-size: 300% 300%;
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
        
        /* Mobile responsive breakpoints */
        @media (min-width: 475px) {
          .xs:inline {
            display: inline;
          }
        }
        
        /* Ensure proper flex alignment on mobile */
        @media (max-width: 640px) {
          nav button {
            min-width: 60px;
          }
        }
        
        /* Better mobile spacing */
        @media (max-width: 475px) {
          nav {
            gap: 0.5rem;
          }
          
          nav button {
            min-width: 50px;
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerMenu;