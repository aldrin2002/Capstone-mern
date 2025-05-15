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
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-base md:text-lg font-medium text-gray-900 truncate pr-2">
                                Order Details - {selectedOrder._id}
                            </h3>
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="px-4 py-3 md:px-6 md:py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                                <div>
                                    <p className="text-xs md:text-sm text-gray-500">Customer</p>
                                    <p className="font-medium text-sm md:text-base">{selectedOrder.customer.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-gray-500">Contact</p>
                                    <p className="font-medium text-sm md:text-base">{selectedOrder.customer.email}</p>
                                    {selectedOrder.customer.phone && (
                                        <p className="text-xs md:text-sm text-gray-600">{selectedOrder.customer.phone}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-gray-500">Date</p>
                                    <p className="font-medium text-sm md:text-base">{formatDate(selectedOrder.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-gray-500">Status</p>
                                    <p className={`inline-flex items-center ${getStatusClass(selectedOrder.status)} px-2 py-1 rounded-full text-xs font-medium`}>
                                        {getStatusIcon(selectedOrder.status)}
                                        <span className="ml-1">{selectedOrder.status}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-gray-500">Payment Method</p>
                                    <div className="mt-1">{getPaymentBadge(selectedOrder.paymentMethod)}</div>
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-gray-500">Payment Status</p>
                                    <div className="mt-1">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            selectedOrder.paymentStatus === "Paid" 
                                                ? "bg-green-100 text-green-800" 
                                                : selectedOrder.paymentStatus === "Failed"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-yellow-100 text-yellow-800"
                                        }`}>
                                            {selectedOrder.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {selectedOrder.notes && (
                                <div className="mb-4 md:mb-6">
                                    <p className="text-xs md:text-sm text-gray-500">Notes</p>
                                    <p className="text-sm md:text-base text-gray-700">{selectedOrder.notes}</p>
                                </div>
                            )}

                            {/* Proof of Payment Section */}
                            {selectedOrder.proofOfPayment && (
                                <div className="mb-4 md:mb-6 border-t border-gray-200 pt-3 md:pt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-medium text-sm md:text-base">Proof of Payment</h4>
                                        <button 
                                            onClick={() => setShowProofImage(!showProofImage)}
                                            className="text-blue-600 hover:text-blue-800 text-xs md:text-sm flex items-center"
                                        >
                                            {showProofImage ? "Hide Image" : "Show Image"}
                                            <Image className="ml-1 h-3 w-3 md:h-4 md:w-4" />
                                        </button>
                                    </div>
                                    
                                    {showProofImage && (
                                        <div className="mt-2">
                                            <div className="flex justify-center">
                                                <img 
                                                    src={`${API_BASE_URL}${selectedOrder.proofOfPayment}`}
                                                    alt="Proof of Payment" 
                                                    className="max-h-48 md:max-h-64 rounded-lg shadow border border-gray-200"
                                                    onClick={() => setFullScreenImage(`${API_BASE_URL}${selectedOrder.proofOfPayment}`)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </div>
                                            <div className="flex justify-center mt-2">
                                                <button 
                                                    onClick={() => setFullScreenImage(`${API_BASE_URL}${selectedOrder.proofOfPayment}`)}
                                                    className="text-blue-600 hover:text-blue-800 text-xs md:text-sm flex items-center"
                                                >
                                                    <ZoomIn className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                                                    View Full Size
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <div className="border-t border-gray-200 pt-3 md:pt-4">
                                <h4 className="font-medium mb-2 text-sm md:text-base">Order Items</h4>
                                <div className="overflow-x-auto -mx-4 md:mx-0">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr>
                                                <th className="py-2 pl-4 md:pl-0 pr-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                                <th className="py-2 px-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                                                <th className="py-2 px-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                                                <th className="py-2 pl-2 pr-4 md:pr-0 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {selectedOrder.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="py-3 pl-4 md:pl-0 pr-2 text-xs md:text-sm">{item.name}</td>
                                                    <td className="py-3 px-2 text-xs md:text-sm text-right">{item.quantity}</td>
                                                    <td className="py-3 px-2 text-xs md:text-sm text-right">₱{item.price.toFixed(2)}</td>
                                                    <td className="py-3 pl-2 pr-4 md:pr-0 text-xs md:text-sm text-right">₱{(item.price * item.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan="3" className="py-3 pl-4 md:pl-0 text-right font-medium text-xs md:text-sm">Total:</td>
                                                <td className="py-3 pl-2 pr-4 md:pr-0 text-right font-medium text-xs md:text-sm">₱{selectedOrder.total.toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <div className="border-t border-gray-200 px-4 py-3 md:px-6 md:py-4 flex flex-col sm:flex-row sm:justify-between gap-3">
                            <button 
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center text-xs md:text-sm"
                                onClick={() => {
                                    Swal.fire({
                                        title: 'Delete this order?',
                                        text: "This action cannot be undone!",
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#d33',
                                        cancelButtonColor: '#3085d6',
                                        confirmButtonText: 'Yes, delete it!'
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            deleteOrder(selectedOrder._id);
                                        }
                                    });
                                }}
                                disabled={isLoading}
                            >
                                <Trash className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                Delete Order
                            </button>
                        
                            <div className="flex flex-col sm:flex-row gap-2">
                                {selectedOrder.status === "Pending" && (
                                    <>
                                        <button 
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs md:text-sm"
                                            onClick={() => {
                                                Swal.fire({
                                                    title: 'Process this order?',
                                                    text: "You are about to change the status to Processing",
                                                    icon: 'question',
                                                    showCancelButton: true,
                                                    confirmButtonColor: '#3085d6',
                                                    cancelButtonColor: '#d33',
                                                    confirmButtonText: 'Yes, process it!'
                                                }).then((result) => {
                                                    if (result.isConfirmed) {
                                                        updateOrderStatus(selectedOrder._id, "Processing");
                                                    }
                                                });
                                            }}
                                            disabled={isLoading}
                                        >
                                            Process Order
                                        </button>
                                        <button 
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs md:text-sm"
                                            onClick={() => {
                                                Swal.fire({
                                                    title: 'Cancel this order?',
                                                    text: "This action cannot be undone",
                                                    icon: 'warning',
                                                    showCancelButton: true,
                                                    confirmButtonColor: '#3085d6',
                                                    cancelButtonColor: '#d33',
                                                    confirmButtonText: 'Yes, cancel it!'
                                                }).then((result) => {
                                                    if (result.isConfirmed) {
                                                        updateOrderStatus(selectedOrder._id, "Cancelled");
                                                    }
                                                });
                                            }}
                                            disabled={isLoading}
                                        >
                                            Cancel Order
                                        </button>
                                    </>
                                )}
                                {selectedOrder.status === "Processing" && (
                                    <button 
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs md:text-sm"
                                        onClick={() => {
                                            Swal.fire({
                                                title: 'Complete this order?',
                                                text: "You are marking this order as completed",
                                                icon: 'info',
                                                showCancelButton: true,
                                                confirmButtonColor: '#28a745',
                                                cancelButtonColor: '#d33',
                                                confirmButtonText: 'Yes, complete it!'
                                            }).then((result) => {
                                                if (result.isConfirmed) {
                                                    updateOrderStatus(selectedOrder._id, "Completed");
                                                }
                                            });
                                        }}
                                        disabled={isLoading}
                                    >
                                        Mark as Completed
                                    </button>
                                )}
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
