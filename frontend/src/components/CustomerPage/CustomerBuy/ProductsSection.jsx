import React from 'react';
import { Coffee, Star, Sparkles, Zap, Filter, ShoppingCart } from 'lucide-react';
import ProductCard from './ProductCard';

const ProductsSection = ({ 
  activeCategory, 
  filteredProducts, 
  isLoading, 
  addToCart, 
  products 
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

  // Calculate product count for the active category
  const getProductCountForCategory = (category) => {
    console.log("ProductsSection - Getting count for category:", category);
    console.log("ProductsSection - Products:", products);
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      console.log("ProductsSection - No products available");
      return 0;
    }
    
    const count = products.filter(product => product.category === category).length;
    console.log(`ProductsSection - ${category} count:`, count);
    return count;
  };

  // Get the current category product count
  const currentCategoryCount = getProductCountForCategory(activeCategory);

  console.log("ProductsSection - Current category:", activeCategory);
  console.log("ProductsSection - Current category count:", currentCategoryCount);
  console.log("ProductsSection - Filtered products length:", filteredProducts?.length || 0);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Section Header */}
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
            {currentCategoryCount} {currentCategoryCount === 1 ? 'item' : 'items'} available
          </p>
        </div>
        
        {filteredProducts && filteredProducts.some(product => product.featured) && (
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
              <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto shadow-lg"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <ShoppingCart className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
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
      ) : currentCategoryCount === 0 ? (
        <div className="text-center py-24">
          <div className="max-w-lg mx-auto">
            <div className="relative mb-12">
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
          {filteredProducts && filteredProducts.map((product, index) => (
            <ProductCard
              key={product._id}
              product={product}
              index={index}
              addToCart={addToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsSection;