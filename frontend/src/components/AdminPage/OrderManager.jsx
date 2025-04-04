import React, { useState, useEffect } from "react";
import { ShoppingCart, Search, Filter, Eye, CheckCircle, XCircle, Clock, Loader } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/orders" : "/api/orders";

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
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

    // Get order details
    const getOrderDetails = async (id) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/${id}`, {
                withCredentials: true // Include cookies with request
            });
            setSelectedOrder(response.data);
        } catch (error) {
            console.error("Error fetching order details:", error);
            toast.error("Failed to fetch order details");
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading && !orders.length) {
        return (
            <div className="p-6 h-full flex justify-center items-center">
                <Loader className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="p-6 h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-800">Orders Management</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by order ID or customer name..."
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-5 w-5 text-gray-400" />
                        </div>
                        <select 
                            className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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
                <div className="text-center py-10">
                    <p className="text-gray-500">No orders found.</p>
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{order._id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{order.customer.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">${order.total.toFixed(2)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusClass(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            <span className="ml-1">{order.status}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => getOrderDetails(order._id)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            <Eye className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">Order Details - {selectedOrder._id}</h3>
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="px-6 py-4">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-sm text-gray-500">Customer</p>
                                    <p className="font-medium">{selectedOrder.customer.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Contact</p>
                                    <p className="font-medium">{selectedOrder.customer.email}</p>
                                    {selectedOrder.customer.phone && (
                                        <p className="text-sm text-gray-600">{selectedOrder.customer.phone}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Date</p>
                                    <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <p className={`inline-flex items-center ${getStatusClass(selectedOrder.status)} px-2 py-1 rounded-full text-xs font-medium`}>
                                        {getStatusIcon(selectedOrder.status)}
                                        <span className="ml-1">{selectedOrder.status}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Payment Method</p>
                                    <p className="font-medium">{selectedOrder.paymentMethod}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Payment Status</p>
                                    <p className="font-medium">{selectedOrder.paymentStatus}</p>
                                </div>
                            </div>
                            
                            {selectedOrder.notes && (
                                <div className="mb-6">
                                    <p className="text-sm text-gray-500">Notes</p>
                                    <p className="text-gray-700">{selectedOrder.notes}</p>
                                </div>
                            )}
                            
                            <div className="border-t border-gray-200 pt-4">
                                <h4 className="font-medium mb-2">Order Items</h4>
                                <table className="min-w-full">
                                    <thead>
                                        <tr>
                                            <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                            <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                                            <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                                            <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {selectedOrder.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="py-3 text-sm">{item.name}</td>
                                                <td className="py-3 text-sm text-right">{item.quantity}</td>
                                                <td className="py-3 text-sm text-right">${item.price.toFixed(2)}</td>
                                                <td className="py-3 text-sm text-right">${(item.price * item.quantity).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="3" className="py-3 text-right font-medium">Total:</td>
                                            <td className="py-3 text-right font-medium">${selectedOrder.total.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                        
                        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
                            {selectedOrder.status === "Pending" && (
                                <>
                                    <button 
                                        className="mr-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                        onClick={() => updateOrderStatus(selectedOrder._id, "Processing")}
                                        disabled={isLoading}
                                    >
                                        Process Order
                                    </button>
                                    <button 
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                                        onClick={() => updateOrderStatus(selectedOrder._id, "Cancelled")}
                                        disabled={isLoading}
                                    >
                                        Cancel Order
                                    </button>
                                </>
                            )}
                            {selectedOrder.status === "Processing" && (
                                <button 
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                                    onClick={() => updateOrderStatus(selectedOrder._id, "Completed")}
                                    disabled={isLoading}
                                >
                                    Mark as Completed
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManager;
