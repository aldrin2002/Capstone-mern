import React from 'react';
import { Coffee, Star, ShoppingCart } from 'lucide-react';

const ProductCard = ({ product, index, addToCart }) => {
  return (
    <div
      className="group bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden transform transition-all duration-700 hover:scale-[1.03] hover:shadow-2xl border border-white/60 hover:border-blue-300/60 animate-fade-in-up relative"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
      
      {/* Product Image */}
      <div className="relative h-48 md:h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
            loading="lazy"
            onError={(e) => {
              console.error("Image load error for product:", product.name, "URL:", product.image);
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* Fallback when no image or image fails to load */}
        <div 
          className={`w-full h-full flex items-center justify-center ${
            product.image ? 'hidden' : ''
          }`}
          style={{ display: product.image ? 'none' : 'flex' }}
        >
          <Coffee className="h-16 w-16 text-gray-400 group-hover:scale-110 transition-transform duration-300" />
        </div>
        
        {/* Featured badge */}
        {product.featured && (
          <div className="absolute top-4 right-4 group-hover:scale-110 transition-transform duration-300">
            <div className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full shadow-xl backdrop-blur-sm border-2 border-white/30 hover:from-amber-600 hover:to-yellow-600">
              <Star className="h-4 w-4 mr-2 animate-spin-slow" fill="currentColor" />
              <span className="text-xs font-bold tracking-wide">POPULAR</span>
            </div>
          </div>
        )}
        
        {/* Price overlay */}
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
        
        <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
      
      {/* Product Info */}
      <div className="p-6 relative">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors duration-300 group-hover:scale-105 transform transition-transform duration-300">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
            {product.description}
          </p>
        </div>
        
        {/* Add to Cart Button */}
        <button 
          onClick={() => addToCart(product)}
          disabled={product.stock <= 0}
          className={`w-full py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-lg hover:shadow-xl text-base relative overflow-hidden group ${
            product.stock > 0 
              ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white" 
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <ShoppingCart className="w-5 h-5 mr-2 relative" />
          <span className="relative">
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </span>
          
          {product.stock > 0 && (
            <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
          )}
        </button>
        
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
      </div>
    </div>
  );
};

export default ProductCard;