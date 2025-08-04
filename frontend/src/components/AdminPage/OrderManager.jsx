import React, { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader, 
  Trash, 
  Image, 
  ZoomIn, 
  X,
  TrendingUp,
  Package,
  DollarSign,
  Users,
  Calendar,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
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
    
    // Calculate stats
    const stats = {
        total: orders.length,
        pending: orders.filter(order => order.status === "Pending").length,
        processing: orders.filter(order => order.status === "Processing").length,
        completed: orders.filter(order => order.status === "Completed").length,
        cancelled: orders.filter(order => order.status === "Cancelled").length,
        totalRevenue: orders.filter(order => order.status === "Completed").reduce((sum, order) => sum + order.total, 0)
    };
    
    // Fetch all orders
    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(API_URL, {
                withCredentials: true
            });
            setOrders(response.data);
        } catch (error) {
            console.error("Error fetching orders:", error);
            Swal.fire({
                icon: 'error',
                title: 'Load Failed',
                text: 'Failed to load orders',
                confirmButtonColor: '#3085d6',
            });
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
                withCredentials: true
            });
            setOrders(response.data);
        } catch (error) {
            console.error(`Error fetching ${status} orders:`, error);
            Swal.fire({
                icon: 'error',
                title: 'Load Failed',
                text: `Failed to load ${status.toLowerCase()} orders`,
                confirmButtonColor: '#3085d6',
            });
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
                return "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300";
            case "Cancelled":
                return "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300";
            case "Processing":
                return "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300";
            case "Pending":
                return "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300";
            default:
                return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300";
        }
    };
    
    // Get payment method badge
    const getPaymentBadge = (paymentMethod) => {
        switch(paymentMethod) {
            case "Online Payment":
                return (
                    <span className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-sm">
                        <Image className="h-3 w-3 mr-1" />
                        Online
                    </span>
                );
            case "Cash":
                return (
                    <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-sm">
                        Cash
                    </span>
                );
            default:
                return (
                    <span className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-sm">
                        {paymentMethod}
                    </span>
                );
        }
    };
    
    // Update order status
    const updateOrderStatus = async (id, status) => {
        Swal.fire({
            title: 'Updating...',
            html: 'Please wait while we update the order status',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        setIsLoading(true);
        try {
            await axios.patch(`${API_URL}/${id}/status`, { status }, {
                withCredentials: true
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Updated!',
                text: `Order status updated to ${status}`,
                timer: 1500,
                showConfirmButton: false
            });
            
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
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: error.response?.data?.message || 'Failed to update order status',
                confirmButtonColor: '#3085d6',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const deleteOrder = async (id) => {
        Swal.fire({
            title: 'Deleting...',
            html: 'Please wait while we delete the order',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        setIsLoading(true);
        try {
            await axios.delete(`${API_URL}/${id}`, {
                withCredentials: true
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Order deleted successfully',
                timer: 1500,
                showConfirmButton: false
            });
            
            // Remove order from local state
            setOrders(orders.filter(order => order._id !== id));
            
            // Close modal if the deleted order was selected
            if (selectedOrder && selectedOrder._id === id) {
                setSelectedOrder(null);
            }
        } catch (error) {
            console.error("Error deleting order:", error);
            Swal.fire({
                icon: 'error',
                title: 'Delete Failed',
                text: error.response?.data?.message || 'Failed to delete order',
                confirmButtonColor: '#3085d6',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Get order details
    const getOrderDetails = async (id) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/${id}`, {
                withCredentials: true
            });
            setSelectedOrder(response.data);
            
            // Reset image states
            setShowProofImage(false);
            setFullScreenImage(null);
        } catch (error) {
            console.error("Error fetching order details:", error);
            Swal.fire({
                icon: 'error',
                title: 'Load Failed',
                text: 'Failed to fetch order details',
                confirmButtonColor: '#3085d6',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading && !orders.length) {
        return (
            <div className="p-6 h-full flex justify-center items-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <p className="mt-4 text-gray-600 font-medium">Loading orders...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-full pb-28">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3"></div>
                        Order Management
                    </h2>
                    <p className="text-gray-600 mt-1">Monitor and manage customer orders</p>
                </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Orders</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {stats.total}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                            <ShoppingCart className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pending</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">
                                {stats.pending}
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-xl group-hover:bg-yellow-100 transition-colors">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Processing</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {stats.processing}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Completed</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                                {stats.completed}
                            </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Cancelled</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                                {stats.cancelled}
                            </p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Revenue</p>
                            <p className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                ₱{stats.totalRevenue.toFixed(2)}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                            <DollarSign className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Search and Filter */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by order ID or customer name..."
                            className="pl-12 w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Filter className="h-5 w-5 text-gray-400" />
                        </div>
                        <select 
                            className="pl-12 w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
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
            
            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-xl font-medium text-gray-500">No orders found</p>
                    <p className="text-gray-400 mt-2">Try adjusting your search criteria or filter</p>
                </div>
            ) : (
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
            )}
            
            {/* Enhanced Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
                        {/* Enhanced Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 md:px-6 md:py-5">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold">Order Details</h3>
                                    <p className="text-blue-100 text-sm">Order #{selectedOrder._id.slice(-8)}</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-white hover:text-gray-200 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-4 md:p-6">
                                {/* Customer & Order Info Cards */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
                                    {/* Customer Information Card */}
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                                        <div className="flex items-center mb-4">
                                            <div className="bg-blue-500 p-3 rounded-xl mr-3 shadow-lg">
                                                <Users className="h-5 w-5 text-white" />
                                            </div>
                                            <h4 className="font-bold text-blue-900 text-lg">Customer Information</h4>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-3">
                                                <Users className="h-4 w-4 text-blue-600" />
                                                <span className="text-blue-700 text-sm font-medium">Name:</span>
                                                <span className="font-bold text-blue-900">{selectedOrder.customer.name}</span>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Mail className="h-4 w-4 text-blue-600" />
                                                <span className="text-blue-700 text-sm font-medium">Email:</span>
                                                <span className="text-blue-800">{selectedOrder.customer.email}</span>
                                            </div>
                                            {selectedOrder.customer.phone && (
                                                <div className="flex items-center space-x-3">
                                                    <Phone className="h-4 w-4 text-blue-600" />
                                                    <span className="text-blue-700 text-sm font-medium">Phone:</span>
                                                    <span className="text-blue-800">{selectedOrder.customer.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Information Card */}
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                                        <div className="flex items-center mb-4">
                                            <div className="bg-green-500 p-3 rounded-xl mr-3 shadow-lg">
                                                <ShoppingCart className="h-5 w-5 text-white" />
                                            </div>
                                            <h4 className="font-bold text-green-900 text-lg">Order Information</h4>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="h-4 w-4 text-green-600" />
                                                    <span className="text-green-700 text-sm font-medium">Date:</span>
                                                </div>
                                                <span className="font-bold text-green-900">{formatDate(selectedOrder.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-green-700 text-sm font-medium">Status:</span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center ${getStatusClass(selectedOrder.status)}`}>
                                                    {getStatusIcon(selectedOrder.status)}
                                                    <span className="ml-1">{selectedOrder.status}</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-green-700 text-sm font-medium">Payment:</span>
                                                {getPaymentBadge(selectedOrder.paymentMethod)}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-green-700 text-sm font-medium">Total:</span>
                                                <span className="font-bold text-xl text-green-600">₱{selectedOrder.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes Section */}
                                {selectedOrder.notes && (
                                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 mb-6">
                                        <div className="flex items-center mb-3">
                                            <div className="bg-yellow-500 p-2 rounded-xl mr-3 shadow-lg">
                                                <Search className="h-4 w-4 text-white" />
                                            </div>
                                            <h4 className="font-bold text-yellow-800 text-lg">Order Notes</h4>
                                        </div>
                                        <p className="text-yellow-700 bg-yellow-100 p-4 rounded-xl border border-yellow-200">{selectedOrder.notes}</p>
                                    </div>
                                )}

                                {/* Proof of Payment Section */}
                                {selectedOrder.proofOfPayment && (
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 mb-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center">
                                                <div className="bg-purple-500 p-2 rounded-xl mr-3 shadow-lg">
                                                    <Image className="h-4 w-4 text-white" />
                                                </div>
                                                <h4 className="font-bold text-purple-800 text-lg">Proof of Payment</h4>
                                            </div>
                                            <button 
                                                onClick={() => setShowProofImage(!showProofImage)}
                                                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                            >
                                                {showProofImage ? "Hide" : "Show"} Image
                                            </button>
                                        </div>
                                        
                                        {showProofImage && (
                                            <div className="mt-4">
                                                <div className="flex justify-center">
                                                    <img 
                                                        src={`${API_BASE_URL}${selectedOrder.proofOfPayment}`}
                                                        alt="Proof of Payment" 
                                                        className="max-h-48 md:max-h-64 rounded-xl shadow-lg border-2 border-purple-200 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                                        onClick={() => setFullScreenImage(`${API_BASE_URL}${selectedOrder.proofOfPayment}`)}
                                                    />
                                                </div>
                                                <div className="flex justify-center mt-4">
                                                    <button 
                                                        onClick={() => setFullScreenImage(`${API_BASE_URL}${selectedOrder.proofOfPayment}`)}
                                                        className="text-purple-600 hover:text-purple-800 font-medium flex items-center space-x-2 bg-purple-100 hover:bg-purple-200 px-4 py-2 rounded-xl transition-all duration-300"
                                                    >
                                                        <ZoomIn className="h-4 w-4" />
                                                        <span>View Full Size</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Order Items */}
                                <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg">
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b-2 border-gray-200">
                                        <h4 className="font-bold text-gray-900 text-lg flex items-center">
                                            <ShoppingCart className="h-5 w-5 mr-3 text-blue-600" />
                                            Order Items ({selectedOrder.items.length})
                                        </h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Item</th>
                                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Qty</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Price</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {selectedOrder.items.map((item, index) => (
                                                    <tr key={index} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.name}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                                                {item.quantity}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-700 text-right">₱{item.price.toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">₱{(item.price * item.quantity).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gradient-to-r from-green-50 to-green-100">
                                                <tr>
                                                    <td colSpan="3" className="px-6 py-4 text-right text-lg font-bold text-gray-900">Total Amount:</td>
                                                    <td className="px-6 py-4 text-right text-xl font-bold text-green-600">₱{selectedOrder.total.toFixed(2)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Enhanced Action Buttons Footer */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200 px-4 py-4 md:px-6 md:py-5">
                            {/* Mobile Layout */}
                            <div className="block md:hidden space-y-3">
                                {/* Status Action Buttons */}
                                {selectedOrder.status === "Pending" && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
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
                                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
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
                                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
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
                                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
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
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
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
                                                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold flex items-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
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
                                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
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
                                        <div className="flex items-center text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 px-6 py-3 rounded-xl border border-gray-300">
                                            <span className="font-medium">No actions available for {selectedOrder.status.toLowerCase()} orders</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Enhanced Full screen image modal */}
            {fullScreenImage && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
                    onClick={() => setFullScreenImage(null)}
                >
                    <div 
                        className="relative max-w-6xl max-h-[95vh] overflow-hidden flex flex-col bg-white rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold">Proof of Payment</h3>
                                <button 
                                    onClick={() => setFullScreenImage(null)}
                                    className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200"
                                    aria-label="Close full screen image"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-gray-50">
                            <img 
                                src={fullScreenImage}
                                alt="Proof of Payment" 
                                className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
                            />
                        </div>
                        
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white text-center rounded-b-2xl">
                            <a 
                                href={fullScreenImage} 
                                download="proof-of-payment.jpg"
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 inline-flex items-center space-x-2"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Download Image</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManager;
