import React from 'react';
import { ShoppingCart, Coffee, Star, Sparkles, Zap, Filter } from 'lucide-react';

const CategoryNavigation = ({ 
  categories, 
  activeCategory, 
  setActiveCategory, 
  cart, 
  setShowCartModal, 
  isMobile, 
  cartTotal,
  products // Add products prop to get the full product list
}) => {
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

  // Function to get product count for each category
  const getProductCountForCategory = (category) => {
    if (!products || products.length === 0) return 0;
    return products.filter(product => product.category === category).length;
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 z-30 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-400/5 to-purple-500/5"></div>
      
      <div className="relative container mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between">
          <nav className="flex overflow-x-auto pb-2 hide-scrollbar space-x-3 md:space-x-4 flex-1">
            {categories.map((category, index) => {
              const productCount = getProductCountForCategory(category);
              
              return (
                <button
                  key={category}
                  className={`group flex items-center justify-center px-4 py-2.5 md:px-6 md:py-3 whitespace-nowrap text-sm md:text-base font-semibold rounded-xl md:rounded-2xl transition-all duration-500 transform hover:scale-105 relative overflow-hidden min-w-0 flex-shrink-0 ${
                    activeCategory === category
                      ? "bg-gradient-to-r from-brand via-primary-700 to-primary-800 text-white shadow-xl shadow-brand/25"
                      : "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-lg border border-gray-200/50 hover:border-primary-300/50"
                  }`}
                  onClick={() => setActiveCategory(category)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r from-primary-400/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl md:rounded-2xl ${
                    activeCategory === category ? 'opacity-100' : ''
                  }`}></div>
                  
                  <span className="relative mr-2 transition-transform duration-300 group-hover:scale-110">
                    {getCategoryIcon(category)}
                  </span>
                  
                  <span className="relative font-bold tracking-wide">
                    {category}
                  </span>
                  
                  <div className={`relative ml-1.5 md:ml-3 px-2 md:px-3 py-0.5 md:py-1 text-xs font-bold rounded-full transition-all duration-300 flex items-center justify-center ${
                    activeCategory === category
                      ? "bg-white/20 text-white border border-white/30"
                      : "bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-700 border border-gray-200"
                  }`}>
                    {productCount}
                  </div>
                </button>
              );
            })}
          </nav>
          
          {isMobile ? (
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setShowCartModal(true)}
                className="bg-gradient-to-r from-brand to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 relative group"
              >
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse font-bold shadow-lg">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          ) : (
            <div className="fixed bottom-6 right-6 z-40">
              <button
                onClick={() => setShowCartModal(true)}
                className="bg-gradient-to-r from-brand to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white p-4 rounded-2xl shadow-2xl hover:shadow-brand/25 transition-all duration-300 transform hover:scale-110 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative flex items-center">
                  <ShoppingCart className="w-6 h-6 mr-2" />
                  <span className="font-semibold">Cart</span>
                  {cart.length > 0 && (
                    <span className="ml-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-full h-6 w-6 flex items-center justify-center animate-bounce font-bold shadow-lg">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                
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
  );
};

export default CategoryNavigation;