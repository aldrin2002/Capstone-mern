import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

// Import split components
import OrderStats from "./OrderManager/OrderStats";
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

            {/* Stats Cards */}
            <OrderStats stats={stats} />

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
        </div>
    );
};

export default OrderManager;
