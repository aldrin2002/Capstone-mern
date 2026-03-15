import React from "react";
import { 
  ShoppingCart, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Truck,
  Image 
} from "lucide-react";

const OrderTable = ({ filteredOrders, getOrderDetails, formatDate }) => {
  const getStatusIcon = (status) => {
    switch(status) {
      case "Completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "Cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "Ready for Delivery":
        return <Truck className="h-5 w-5 text-cyan-600" />;
      case "Preparing Food":
        return <Clock className="h-5 w-5 text-indigo-500" />;
      case "Delivered":
        return <Truck className="h-5 w-5 text-blue-500" />;
      case "Processing":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "Pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };
  
  const getStatusClass = (status) => {
    switch(status) {
      case "Completed":
        return "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300";
      case "Cancelled":
        return "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300";
      case "Ready for Delivery":
        return "bg-gradient-to-r from-cyan-100 to-teal-200 text-cyan-900 border-cyan-300";
      case "Preparing Food":
        return "bg-gradient-to-r from-indigo-100 to-blue-200 text-indigo-900 border-indigo-300";
      case "Delivered":
        return "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300";
      case "Processing":
        return "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300";
      case "Pending":
        return "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300";
    }
  };
  
  const getPaymentBadge = (paymentMethod) => {
    // Normalize for all online payments
    if (
      paymentMethod === "Online Payment" ||
      paymentMethod === "GCash"
    ) {
      return (
        <span className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-sm">
          <Image className="h-3 w-3 mr-1" />
          Online
        </span>
      );
    }
    // Normalize for all cash payments
    if (
      paymentMethod === "Cash" ||
      paymentMethod === "Cash on Delivery"
    ) {
      return (
        <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-sm">
          Cash
        </span>
      );
    }
    // Fallback for unknown
    return (
      <span className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-sm">
        {paymentMethod}
      </span>
    );
  };

  if (filteredOrders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-xl font-medium text-gray-500">No orders found</p>
        <p className="text-gray-400 mt-2">Try adjusting your search criteria or filter</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-3 md:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Order ID</th>
              <th className="px-3 md:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Customer</th>
              <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
              <th className="px-3 md:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
              <th className="px-3 md:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-3 md:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Payment</th>
              <th className="px-3 md:px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredOrders.map((order, index) => (
              <tr key={order._id} className={`group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  <div className="text-xs md:text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate max-w-[80px] md:max-w-[120px]">
                    #{order._id.slice(-6)}
                  </div>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  <div className="text-xs md:text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors truncate max-w-[80px] md:max-w-full">
                    {order.customer.name}
                  </div>
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{formatDate(order.createdAt)}</div>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  <div className="text-xs md:text-sm font-bold text-gray-900">₱{order.total.toFixed(2)}</div>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full items-center border transition-all duration-300 ${getStatusClass(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{order.status}</span>
                  </span>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  {getPaymentBadge(order.paymentMethod)}
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-right">
                  <button 
                    onClick={() => getOrderDetails(order._id)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl inline-flex items-center text-xs transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    <span className="font-medium">View</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;