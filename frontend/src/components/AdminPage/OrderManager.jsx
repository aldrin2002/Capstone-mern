import React, { useState, useEffect } from "react";
import { ShoppingCart, Search, Filter, Eye, CheckCircle, XCircle, Clock, Loader, Trash, Image, ZoomIn, X } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/orders" : "/api/orders";
const API_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [showProofImage, setShowProofImage] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState(null);
    
    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const statuses = ["All", "Pending", "Processing", "Completed", "Cancelled"];
    
    // Fetch all orders
    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(API_URL, {
                withCredentials: true // Include cookies with request
            });
            setOrders(response.data);
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Failed to load orders");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Initial fetch
    useEffect(() => {
        fetchOrders();
    }, []);
    
    // Fetch orders by status
    const fetchOrdersByStatus = async (status) => {
        if (status === "All") {
            fetchOrders();
            return;
        }
        
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/status/${status}`, {
                withCredentials: true // Include cookies with request
            });
            setOrders(response.data);
        } catch (error) {
            console.error(`Error fetching ${status} orders:`, error);
            toast.error(`Failed to load ${status.toLowerCase()} orders`);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Handle status filter change
    const handleStatusFilterChange = (e) => {
        const status = e.target.value;
        setStatusFilter(status);
        fetchOrdersByStatus(status);
    };
    
    // Filter orders based on search term
    const filteredOrders = orders.filter(order => 
        (order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         order._id.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const formatDate = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };
    
    const getStatusIcon = (status) => {
        switch(status) {
            case "Completed":
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case "Cancelled":
                return <XCircle className="h-5 w-5 text-red-500" />;
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
                return "bg-green-100 text-green-800";
            case "Cancelled":
                return "bg-red-100 text-red-800";
            case "Processing":
                return "bg-blue-100 text-blue-800";
            case "Pending":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    
    // Get payment method badge
    const getPaymentBadge = (paymentMethod) => {
        switch(paymentMethod) {
            case "Online Payment":
                return (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center">
                        <Image className="h-3 w-3 mr-1" />
                        Online
                    </span>
                );
            case "Cash":
                return (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                        Cash
                    </span>
                );
            default:
                return (
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs flex items-center">
                        {paymentMethod}
                    </span>
                );
        }
    };
    
    // Update order status
    const updateOrderStatus = async (id, status) => {
        setIsLoading(true);
        try {
            await axios.patch(`${API_URL}/${id}/status`, { status }, {
                withCredentials: true // Include cookies with request
            });
            toast.success(`Order status updated to ${status}`);
            
            // Update local state
            if (selectedOrder && selectedOrder._id === id) {
                setSelectedOrder({
                    ...selectedOrder,
                    status
                });
            }
            
            // Refresh orders
            if (statusFilter !== "All") {
                fetchOrdersByStatus(statusFilter);
            } else {
                fetchOrders();
            }
        } catch (error) {
            console.error("Error updating order status:", error);
            toast.error("Failed to update order status");
        } finally {
            setIsLoading(false);
        }
    };

    // Add this function after updateOrderStatus
    const deleteOrder = async (id) => {
        setIsLoading(true);
        try {
            await axios.delete(`${API_URL}/${id}`, {
                withCredentials: true
            });
            toast.success("Order deleted successfully");
            
            // Remove order from local state
            setOrders(orders.filter(order => order._id !== id));
            
            // Close modal if the deleted order was selected
            if (selectedOrder && selectedOrder._id === id) {
                setSelectedOrder(null);
            }
        } catch (error) {
            console.error("Error deleting order:", error);
            toast.error("Failed to delete order");
        } finally {
            setIsLoading(false);
        }
    };

    // Get order details
    const getOrderDetails = async (id) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/${id}`, {
                withCredentials: true // Include cookies with request
            });
            setSelectedOrder(response.data);
            
            // Reset image states
            setShowProofImage(false);
            setFullScreenImage(null);
        } catch (error) {
            console.error("Error fetching order details:", error);
            toast.error("Failed to fetch order details");
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading && !orders.length) {
        return (
            <div className="p-3 md:p-6 h-full flex justify-center items-center">
                <div className="text-center">
                    <Loader className="h-8 w-8 md:h-10 md:w-10 text-blue-500 animate-spin mx-auto" />
                    <p className="mt-2 text-sm md:text-base text-gray-500">Loading orders...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-3 md:p-6 h-full pb-20">
            <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-blue-800">Orders</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by ID or customer..."
                        className="pl-9 md:pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                        </div>
                        <select 
                            className="pl-9 md:pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm"
                            value={statusFilter}
                            onChange={handleStatusFilterChange}
                        >
                            {statuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            
            {filteredOrders.length === 0 ? (
                <div className="bg-white shadow rounded-lg p-6 text-center">
                    <ShoppingCart className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm md:text-base">No orders found.</p>
                    <p className="text-gray-400 text-xs md:text-sm mt-1">Try changing your search or filter.</p>
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs md:text-sm font-medium text-gray-900 truncate max-w-[80px] md:max-w-[120px]">{order._id}</div>
                                        </td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs md:text-sm text-gray-900 truncate max-w-[80px] md:max-w-full">{order.customer.name}</div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                                        </td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs md:text-sm text-gray-900">₱{order.total.toFixed(2)}</div>
                                        </td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusClass(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                <span className="ml-1">{order.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end items-center gap-2">
                                                <div className="hidden sm:block">
                                                    {getPaymentBadge(order.paymentMethod)}
                                                </div>
                                                <button 
                                                    onClick={() => getOrderDetails(order._id)}
                                                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-md inline-flex items-center text-xs"
                                                >
                                                    <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                                    <span>View</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
                        {/* Enhanced Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 md:px-6 md:py-5 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg md:text-xl font-bold">Order Details</h3>
                                <p className="text-blue-100 text-sm">ID: {selectedOrder._id}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                className="text-white hover:text-red-300 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        {/* Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-4 md:p-6">
                                {/* Customer & Order Info Cards */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
                                    {/* Customer Information Card */}
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center mb-3">
                                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                                                <Eye className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <h4 className="font-semibold text-gray-900">Customer Information</h4>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <span className="text-gray-600 text-sm w-16">Name:</span>
                                                <span className="font-medium text-sm">{selectedOrder.customer.name}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-gray-600 text-sm w-16">Email:</span>
                                                <span className="text-sm text-gray-700">{selectedOrder.customer.email}</span>
                                            </div>
                                            {selectedOrder.customer.phone && (
                                                <div className="flex items-center">
                                                    <span className="text-gray-600 text-sm w-16">Phone:</span>
                                                    <span className="text-sm text-gray-700">{selectedOrder.customer.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Information Card */}
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center mb-3">
                                            <div className="bg-green-100 p-2 rounded-full mr-3">
                                                <ShoppingCart className="h-4 w-4 text-green-600" />
                                            </div>
                                            <h4 className="font-semibold text-gray-900">Order Information</h4>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600 text-sm">Date:</span>
                                                <span className="font-medium text-sm">{formatDate(selectedOrder.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600 text-sm">Status:</span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center ${getStatusClass(selectedOrder.status)}`}>
                                                    {getStatusIcon(selectedOrder.status)}
                                                    <span className="ml-1">{selectedOrder.status}</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600 text-sm">Payment:</span>
                                                {getPaymentBadge(selectedOrder.paymentMethod)}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600 text-sm">Total:</span>
                                                <span className="font-bold text-lg text-green-600">₱{selectedOrder.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes Section */}
                                {selectedOrder.notes && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                        <div className="flex items-center mb-2">
                                            <div className="bg-yellow-100 p-1 rounded-full mr-2">
                                                <Search className="h-3 w-3 text-yellow-600" />
                                            </div>
                                            <h4 className="font-semibold text-yellow-800">Order Notes</h4>
                                        </div>
                                        <p className="text-sm text-yellow-700">{selectedOrder.notes}</p>
                                    </div>
                                )}

                                {/* Proof of Payment Section */}
                                {selectedOrder.proofOfPayment && (
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center">
                                                <div className="bg-purple-100 p-1 rounded-full mr-2">
                                                    <Image className="h-3 w-3 text-purple-600" />
                                                </div>
                                                <h4 className="font-semibold text-purple-800">Proof of Payment</h4>
                                            </div>
                                            <button 
                                                onClick={() => setShowProofImage(!showProofImage)}
                                                className="text-purple-600 hover:text-purple-800 text-sm font-medium px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded-md transition-colors"
                                            >
                                                {showProofImage ? "Hide" : "Show"} Image
                                            </button>
                                        </div>
                                        
                                        {showProofImage && (
                                            <div className="mt-3">
                                                <div className="flex justify-center">
                                                    <img 
                                                        src={`${API_BASE_URL}${selectedOrder.proofOfPayment}`}
                                                        alt="Proof of Payment" 
                                                        className="max-h-48 md:max-h-64 rounded-lg shadow-md border border-purple-200 cursor-pointer hover:shadow-lg transition-shadow"
                                                        onClick={() => setFullScreenImage(`${API_BASE_URL}${selectedOrder.proofOfPayment}`)}
                                                    />
                                                </div>
                                                <div className="flex justify-center mt-3">
                                                    <button 
                                                        onClick={() => setFullScreenImage(`${API_BASE_URL}${selectedOrder.proofOfPayment}`)}
                                                        className="text-purple-600 hover:text-purple-800 text-sm flex items-center font-medium"
                                                    >
                                                        <ZoomIn className="mr-1 h-4 w-4" />
                                                        View Full Size
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Order Items */}
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                        <h4 className="font-semibold text-gray-900 flex items-center">
                                            <ShoppingCart className="h-4 w-4 mr-2" />
                                            Order Items ({selectedOrder.items.length})
                                        </h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {selectedOrder.items.map((item, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                                {item.quantity}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700 text-right">₱{item.price.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">₱{(item.price * item.quantity).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50">
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-3 text-right text-sm font-bold text-gray-900">Total Amount:</td>
                                                    <td className="px-4 py-3 text-right text-lg font-bold text-green-600">₱{selectedOrder.total.toFixed(2)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Enhanced Action Buttons Footer */}
                        <div className="bg-gray-50 border-t border-gray-200 px-4 py-4 md:px-6 md:py-5">
                            {/* Mobile Layout */}
                            <div className="block md:hidden space-y-3">
                                {/* Status Action Buttons */}
                                {selectedOrder.status === "Pending" && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center transition-colors shadow-md hover:shadow-lg text-sm"
                                            onClick={() => {
                                                Swal.fire({
                                                    title: 'Process Order?',
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
                                            }}
                                            disabled={isLoading}
                                        >
                                            <Clock className="h-4 w-4 mr-2" />
                                            Process
                                        </button>
                                        <button 
                                            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center transition-colors shadow-md hover:shadow-lg text-sm"
                                            onClick={() => {
                                                Swal.fire({
                                                    title: 'Cancel Order?',
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
                                            }}
                                            disabled={isLoading}
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Cancel
                                        </button>
                                    </div>
                                )}
                                
                                {selectedOrder.status === "Processing" && (
                                    <button 
                                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center transition-colors shadow-md hover:shadow-lg"
                                        onClick={() => {
                                            Swal.fire({
                                                title: 'Complete Order?',
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
                                        }}
                                        disabled={isLoading}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Mark as Completed
                                    </button>
                                )}
                                
                                {/* Delete Button */}
                                <button 
                                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center transition-colors shadow-md hover:shadow-lg"
                                    onClick={() => {
                                        Swal.fire({
                                            title: 'Delete Order?',
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
                                    }}
                                    disabled={isLoading}
                                >
                                    <Trash className="h-4 w-4 mr-2" />
                                    Delete Order
                                </button>
                                
                                {/* Status info for completed/cancelled orders */}
                                {(selectedOrder.status === "Completed" || selectedOrder.status === "Cancelled") && (
                                    <div className="text-center py-3 bg-gray-100 rounded-lg">
                                        <span className="text-gray-500 text-sm">
                                            No actions available for {selectedOrder.status.toLowerCase()} orders
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden md:flex justify-between items-center">
                                {/* Delete Button - Left side */}
                                <button 
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors shadow-md hover:shadow-lg"
                                    onClick={() => {
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
                                    }}
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
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors shadow-md hover:shadow-lg"
                                                onClick={() => {
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
                                                }}
                                                disabled={isLoading}
                                            >
                                                <Clock className="h-4 w-4 mr-2" />
                                                Process Order
                                            </button>
                                            <button 
                                                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors shadow-md hover:shadow-lg"
                                                onClick={() => {
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
                                                }}
                                                disabled={isLoading}
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Cancel Order
                                            </button>
                                        </>
                                    )}
                                    {selectedOrder.status === "Processing" && (
                                        <button 
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors shadow-md hover:shadow-lg"
                                            onClick={() => {
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
                                            }}
                                            disabled={isLoading}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Mark as Completed
                                        </button>
                                    )}
                                    {(selectedOrder.status === "Completed" || selectedOrder.status === "Cancelled") && (
                                        <div className="flex items-center text-gray-500 text-sm bg-gray-100 px-4 py-3 rounded-lg">
                                            <span>No actions available for {selectedOrder.status.toLowerCase()} orders</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Full screen image modal */}
            {fullScreenImage && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setFullScreenImage(null)}
                >
                    <div 
                        className="relative max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-0 right-0 p-2">
                            <button 
                                onClick={() => setFullScreenImage(null)}
                                className="bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 text-white"
                                aria-label="Close full screen image"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="bg-black bg-opacity-50 p-2 overflow-auto flex items-center justify-center">
                            <img 
                                src={fullScreenImage}
                                alt="Proof of Payment" 
                                className="max-h-[80vh] max-w-full object-contain"
                            />
                        </div>
                        
                        <div className="bg-black bg-opacity-50 p-4 text-white text-center">
                            <a 
                                href={fullScreenImage} 
                                download="proof-of-payment.jpg"
                                className="text-blue-300 hover:text-blue-100"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Download Image
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManager;
