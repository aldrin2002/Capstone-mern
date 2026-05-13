import React, { useState } from 'react';
import { Coffee, Edit2, Trash2 } from 'lucide-react';

const ProductCard = ({
  product,
  viewMode,
  onEdit,
  onDelete,
  bulkMode = false,
  isSelected = false,
  onToggleSelect = () => {}
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
        viewMode === "list" ? "flex items-center p-4" : ""
      } ${bulkMode && isSelected ? "ring-2 ring-brand" : ""}`}
    >
      <div className={`${viewMode === "list" ? "w-24 h-24 flex-shrink-0 mr-4" : "h-48"} bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden ${viewMode === "grid" ? "rounded-t-2xl" : "rounded-xl"}`}>
        {bulkMode && (
          <div className="absolute top-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
            <label className="flex items-center justify-center w-7 h-7 bg-white/95 rounded-md shadow border border-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(product._id)}
                className="h-4 w-4 accent-brand"
              />
            </label>
          </div>
        )}

        {/* Simple image display */}
        {product.image && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 absolute inset-0 z-10">
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
                  <span className="text-xs text-gray-500">Loading image...</span>
                </div>
              </div>
            )}
            <img
              src={product.image}
              alt={product.name}
              className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Coffee className="h-12 w-12 text-gray-400 mb-2" />
            <span className="text-xs text-gray-500 font-medium text-center px-2">
              {imageError ? "Failed to load" : "No Image"}
            </span>
          </div>
        )}
        
        {/* Enhanced overlay with actions */}
        {!bulkMode && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex space-x-3">
              <button
                onClick={() => onEdit(product)}
                className="p-3 bg-brand hover:bg-primary-700 text-white rounded-full shadow-lg transform hover:scale-110 transition-all duration-300"
                title="Edit Product"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(product._id, product.name)}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transform hover:scale-110 transition-all duration-300"
                title="Delete Product"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Enhanced stock indicator */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-lg backdrop-blur-sm border border-white/30 ${
            product.stock > 5 
              ? "bg-green-500/90 text-white" 
              : product.stock > 0
              ? "bg-orange-500/90 text-white"
              : "bg-red-500/90 text-white"
          }`}>
            {product.stock > 0 ? `${product.stock} left` : "Out of stock"}
          </span>
        </div>

        {/* Featured badge */}
        {product.featured && !bulkMode && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center px-2 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full shadow-lg text-xs font-bold">
              <span>★ FEATURED</span>
            </div>
          </div>
        )}
      </div>

      <div className={`${viewMode === "list" ? "flex-1" : "p-6"}`}>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand transition-colors duration-300 line-clamp-1">
            {product.name}
          </h3>
          <span className="px-4 py-2 bg-gradient-to-r from-brand to-primary-700 text-white text-sm font-bold rounded-full shadow-lg ml-2 whitespace-nowrap">
            ₱{product.price.toFixed(2)}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {product.description || "No description available"}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 text-xs font-medium rounded-full border border-gray-300">
            {product.category}
          </span>
          
          {viewMode === "list" && !bulkMode && (
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(product)}
                className="p-2 bg-primary-100 hover:bg-primary-200 text-brand rounded-xl transition-all duration-300 hover:scale-105"
                title="Edit Product"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(product._id, product.name)}
                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all duration-300 hover:scale-105"
                title="Delete Product"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;