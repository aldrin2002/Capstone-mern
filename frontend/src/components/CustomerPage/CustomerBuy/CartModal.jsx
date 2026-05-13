import React from 'react';
import { X, ShoppingBag, ShoppingCart, Coffee, Plus, Minus, Trash2, Check } from 'lucide-react';

const CartModal = ({ 
  showCartModal, 
  setShowCartModal, 
  cart, 
  updateQuantity, 
  removeFromCart, 
  cartTotal, 
  openPaymentModal 
}) => {
  if (!showCartModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm md:max-w-md max-h-[90vh] overflow-hidden mx-2 md:mx-0">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-brand to-primary-700 text-white p-4 md:p-6 relative">
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
          <p className="text-primary-100 text-xs md:text-sm mt-1">
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
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error("Cart image load error for:", item.name);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-full h-full flex items-center justify-center ${
                            item.image ? 'hidden' : ''
                          }`}
                          style={{ display: item.image ? 'none' : 'flex' }}
                        >
                          <Coffee className="w-4 h-4 md:w-6 md:h-6 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Item Details */}
                      <div className="flex-1 min-w-0 mr-2">
                        <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">{item.name}</h3>
                        <p className="text-brand font-bold text-sm md:text-base">₱{item.price.toFixed(2)}</p>
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
                
                {/* ✅ FIXED: Show TBD instead of hardcoded ₱50.00 */}
                <div className="flex justify-between items-center mb-3 md:mb-4">
                  <span className="text-gray-600 text-sm md:text-base">Delivery Fee:</span>
                  <span className="font-semibold text-sm md:text-base text-brand">
                    To be calculated
                  </span>
                </div>
                
                {/* ✅ FIXED: Remove total calculation here */}
                <div className="flex justify-between items-center mb-4 md:mb-6 text-base md:text-lg font-bold border-t pt-2">
                  <span>Estimated Total:</span>
                  <span className="text-brand">₱{cartTotal.toFixed(2)} + delivery</span>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-2 md:space-y-3">
                  <button 
                    onClick={openPaymentModal}
                    className="w-full bg-gradient-to-r from-brand to-primary-700 text-white py-2.5 md:py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 text-sm md:text-base"
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
  );
};

export default CartModal;