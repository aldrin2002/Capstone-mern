import React from "react";
import { 
  Trash, 
  Clock, 
  XCircle, 
  CheckCircle 
} from "lucide-react";
import Swal from "sweetalert2";

const OrderActionButtons = ({ 
  selectedOrder, 
  updateOrderStatus, 
  deleteOrder, 
  isLoading 
}) => {
  const handleProcessOrder = () => {
    Swal.fire({
      title: 'Process this order?',
      text: "Status will be changed to Processing",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, process it!',
      customClass: { popup: 'rounded-lg' }
    }).then((result) => {
      if (result.isConfirmed) {
        updateOrderStatus(selectedOrder._id, "Processing");
      }
    });
  };

  const handleCancelOrder = () => {
    Swal.fire({
      title: 'Cancel this order?',
      text: "This action cannot be undone",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, cancel it!',
      customClass: { popup: 'rounded-lg' }
    }).then((result) => {
      if (result.isConfirmed) {
        updateOrderStatus(selectedOrder._id, "Cancelled");
      }
    });
  };

  const handleCompleteOrder = () => {
    Swal.fire({
      title: 'Complete this order?',
      text: "Order will be marked as completed",
      icon: 'success',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, complete it!',
      customClass: { popup: 'rounded-lg' }
    }).then((result) => {
      if (result.isConfirmed) {
        updateOrderStatus(selectedOrder._id, "Completed");
      }
    });
  };

  const handleDeleteOrder = () => {
    Swal.fire({
      title: 'Delete this order?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      customClass: { popup: 'rounded-lg' }
    }).then((result) => {
      if (result.isConfirmed) {
        deleteOrder(selectedOrder._id);
      }
    });
  };

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200 px-4 py-4 md:px-6 md:py-5">
      {/* Mobile Layout */}
      <div className="block md:hidden space-y-3">
        {/* Status Action Buttons */}
        {selectedOrder.status === "Pending" && (
          <div className="grid grid-cols-2 gap-3">
            <button 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={handleProcessOrder}
              disabled={isLoading}
            >
              <Clock className="h-4 w-4 mr-2" />
              Process
            </button>
            <button 
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={handleCancelOrder}
              disabled={isLoading}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </button>
          </div>
        )}
        
        {selectedOrder.status === "Processing" && (
          <button 
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            onClick={handleCompleteOrder}
            disabled={isLoading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Completed
          </button>
        )}
        
        {/* Delete Button */}
        <button 
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          onClick={handleDeleteOrder}
          disabled={isLoading}
        >
          <Trash className="h-4 w-4 mr-2" />
          Delete Order
        </button>
        
        {/* Status info for completed/cancelled orders */}
        {(selectedOrder.status === "Completed" || selectedOrder.status === "Cancelled") && (
          <div className="text-center py-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl border border-gray-300">
            <span className="text-gray-600 font-medium">
              No actions available for {selectedOrder.status.toLowerCase()} orders
            </span>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex justify-between items-center">
        {/* Delete Button - Left side */}
        <button 
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          onClick={handleDeleteOrder}
          disabled={isLoading}
        >
          <Trash className="h-4 w-4 mr-2" />
          Delete Order
        </button>
    
        {/* Status Action Buttons - Right side */}
        <div className="flex gap-3">
          {selectedOrder.status === "Pending" && (
            <>
              <button 
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                onClick={handleProcessOrder}
                disabled={isLoading}
              >
                <Clock className="h-4 w-4 mr-2" />
                Process Order
              </button>
              <button 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold flex items-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                onClick={handleCancelOrder}
                disabled={isLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Order
              </button>
            </>
          )}
          {selectedOrder.status === "Processing" && (
            <button 
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={handleCompleteOrder}
              disabled={isLoading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Completed
            </button>
          )}
          {(selectedOrder.status === "Completed" || selectedOrder.status === "Cancelled") && (
            <div className="flex items-center text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 px-6 py-3 rounded-xl border border-gray-300">
              <span className="font-medium">No actions available for {selectedOrder.status.toLowerCase()} orders</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderActionButtons;