import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useMessageNotifications } from "../../context/MessageNotificationContext"; // Import socket context
import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast"; // ✅ FIXED

// Import split components
import OrderSearchFilter from "./OrderManager/OrderSearchFilter";
import OrderTable from "./OrderManager/OrderTable";
import OrderDetailsModal from "./OrderManager/OrderDetailsModal";
import OrderActionButtons from "./OrderManager/OrderActionButtons";
import FullScreenImageModal from "./OrderManager/FullScreenImageModal";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/orders" : "/api/orders";
const API_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showProofImage, setShowProofImage] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState(null);
    const [newOrderCount, setNewOrderCount] = useState(0);
    
    // Get socket for real-time updates
    const { socket } = useMessageNotifications();
    
    // UPDATE: Include "Delivered" status
    const statuses = ["All", "Pending", "Preparing Food", "Ready for Delivery", "Processing", "Delivered", "Completed", "Cancelled"];
    
    // Removed stats summary cards per request (previously computed here)
    
    // NEW: Real-time order status updates
    useEffect(() => {
        if (!socket) return;

        const handleOrderStatusUpdate = (data) => {
            console.log("📡 Received order status update:", data);
            
            // Update orders list
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order._id === data.orderId 
                        ? { ...order, status: data.status, updatedAt: data.updatedAt }
                        : order
                )
            );

            // Update selected order if it's the one being updated
            setSelectedOrder(prevSelected => 
                prevSelected && prevSelected._id === data.orderId
                    ? { ...prevSelected, status: data.status, updatedAt: data.updatedAt }
                    : prevSelected
            );

            // Show notification
            Swal.fire({
                icon: 'info',
                title: 'Order Updated',
                text: `Order ${data.orderId.slice(-6)} status changed to ${data.status}`,
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        };

        socket.on('order-status-updated', handleOrderStatusUpdate);

        return () => {
            socket.off('order-status-updated', handleOrderStatusUpdate);
        };
    }, [socket]);

    // NEW: Real-time driver assignment updates
    useEffect(() => {
        if (!socket) return;

        const handleOrderAssigned = (payload) => {
            const order = payload?.order;
            if (!order) return;

            setOrders(prevOrders => {
                const index = prevOrders.findIndex(o => o._id === order._id);
                if (index >= 0) {
                    const next = [...prevOrders];
                    next[index] = order;
                    return next;
                }
                return [order, ...prevOrders];
            });

            setSelectedOrder(prevSelected =>
                prevSelected && prevSelected._id === order._id ? order : prevSelected
            );
        };

        socket.on('order-assigned', handleOrderAssigned);
        socket.on('order-updated', handleOrderAssigned);

        return () => {
            socket.off('order-assigned', handleOrderAssigned);
            socket.off('order-updated', handleOrderAssigned);
        };
    }, [socket]);

    // Track new orders since component loaded
    useEffect(() => {
        if (!socket) return;
        
        const handleNewOrder = () => {
            setNewOrderCount(prev => prev + 1);
        };
        
        socket.on('new-order', handleNewOrder);
        
        return () => {
            socket.off('new-order', handleNewOrder);
        };
    }, [socket]);

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
    
    // Update order status
    const updateOrderStatus = async (id, status) => {
        // Show confirmation for cancellation
        if (status === "Cancelled") {
            const result = await Swal.fire({
                title: "Cancel Order?",
                html: `
                  <p class="text-gray-600 mb-2">Are you sure you want to cancel this order?</p>
                  <p class="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                    ℹ️ Product quantities will be automatically restored to inventory
                  </p>
                `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#EF4444",
                cancelButtonColor: "#6B7280",
                confirmButtonText: "Yes, cancel order",
                cancelButtonText: "No, keep order"
            });

            if (!result.isConfirmed) {
                return;
            }
        }

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
            // ✅ FIXED: Use correct route format - backend expects /:id/status
            const response = await axios.patch(
                `${API_URL}/${id}/status`, 
                { status }, 
                { withCredentials: true }
            );
            
            // Show success message
            const message = status === "Cancelled" 
                ? "Order cancelled and inventory restored successfully! 📦"
                : `Order status updated to ${status} successfully!`;

            Swal.fire({
                icon: 'success',
                title: 'Updated!',
                text: message,
                timer: 2000,
                showConfirmButton: false
            });
            
            // Update orders list
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order._id === id
                        ? { ...order, status, updatedAt: new Date() }
                        : order
                )
            );
            
            // Update selected order if it's the one being updated
            if (selectedOrder && selectedOrder._id === id) {
                setSelectedOrder({
                    ...selectedOrder,
                    status,
                    updatedAt: new Date()
                });
            }
            
            // Refresh orders based on filter
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
    
    // Refresh orders when user clicks on notification
    const handleRefreshOrders = () => {
        fetchOrders();
        setNewOrderCount(0);
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

            {/* Stats Cards removed */}

            {/* Search and Filter */}
            <OrderSearchFilter 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                handleStatusFilterChange={handleStatusFilterChange}
                statuses={statuses}
            />
            
            {/* Orders Table */}
            <OrderTable 
                filteredOrders={filteredOrders}
                getOrderDetails={getOrderDetails}
                formatDate={formatDate}
            />
            
            {/* Order Details Modal */}
            {selectedOrder && (
                <OrderDetailsModal 
                    selectedOrder={selectedOrder}
                    setSelectedOrder={setSelectedOrder}
                    formatDate={formatDate}
                    showProofImage={showProofImage}
                    setShowProofImage={setShowProofImage}
                    setFullScreenImage={setFullScreenImage}
                    API_BASE_URL={API_BASE_URL}
                    updateOrderStatus={updateOrderStatus}
                    deleteOrder={deleteOrder}
                    isLoading={isLoading}
                />
            )}
            
            {/* Full screen image modal */}
            <FullScreenImageModal 
                fullScreenImage={fullScreenImage}
                setFullScreenImage={setFullScreenImage}
            />

            {/* Notification badge for new orders */}
            {newOrderCount > 0 && (
                <AnimatePresence>
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        onClick={handleRefreshOrders}
                        className="fixed top-20 right-6 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:scale-105 z-50 flex items-center space-x-2"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                <ShoppingCart className="h-5 w-5" />
                            </motion.div>
                            <div className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                {newOrderCount}
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-sm">New Orders!</div>
                            <div className="text-xs">Click to refresh</div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default OrderManager;
