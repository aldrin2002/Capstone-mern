import { useAuthStore } from "../../store/authStore";
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SideNav from "../../components/AdminPage/SideNav";
import UsersManager from "../../components/AdminPage/UsersManager";
import ProductManager from "../../components/AdminPage/ProductManager";
import GalleryManager from "../../components/AdminPage/GalleryManager";
import ContactManager from "../../components/AdminPage/ContactManager";
import OrderManager from "../../components/AdminPage/OrderManager";
import AdminMessage from "../../components/AdminPage/AdminMessage";
import { User, Loader } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const DashboardPage = () => {
    const { user } = useAuthStore();
    const location = useLocation();
    const [activeComponent, setActiveComponent] = useState(() => {
        // Check if we have a state with activeTab from navigation
        return location.state?.activeTab || "dashboard";
    });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [lastOrderCount, setLastOrderCount] = useState(0);

    // Check for route state changes
    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveComponent(location.state.activeTab);
        }
    }, [location.state]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Poll for new orders every 30 seconds
    useEffect(() => {
        const checkForNewOrders = async () => {
            try {
                // Get API URL based on environment
                const apiUrl = import.meta.env.MODE === "development" 
                    ? "http://localhost:5000/api/orders" 
                    : "/api/orders";
                
                const response = await axios.get(apiUrl, { withCredentials: true });
                const currentOrderCount = response.data.length;
                
                // Set initial order count on first load
                if (lastOrderCount === 0) {
                    setLastOrderCount(currentOrderCount);
                    return;
                }
                
                // Check if we have new orders
                if (currentOrderCount > lastOrderCount) {
                    const newOrdersCount = currentOrderCount - lastOrderCount;
                    
                    // Get the newest orders
                    const newOrders = response.data.slice(0, newOrdersCount);
                    
                    // Show toast notification
                    toast.success(
                        <div onClick={() => setActiveComponent("orders")} style={{cursor: 'pointer'}}>
                            <b>{newOrdersCount} new order{newOrdersCount > 1 ? 's' : ''} received!</b><br/>
                            <span style={{fontSize: '0.8rem'}}>Click to view orders</span>
                        </div>, 
                        { 
                            duration: 5000,
                            style: {
                                borderLeft: '4px solid #0070f3',
                            }
                        }
                    );
                    
                    // If admin is not on orders page, also play sound
                    if (activeComponent !== "orders") {
                        const audio = new Audio('/notification.mp3');
                        audio.play().catch(e => console.log("Audio play failed:", e));
                    }
                    
                    // Update order count
                    setLastOrderCount(currentOrderCount);
                }
            } catch (error) {
                console.error("Error checking for new orders:", error);
            }
        };

        // Check immediately on mounting
        checkForNewOrders();
        
        // Set up polling interval (every 30 seconds)
        const interval = setInterval(checkForNewOrders, 30000);
        
        // Clean up interval on unmount
        return () => clearInterval(interval);
    }, [lastOrderCount, activeComponent]);

    const renderComponent = () => {
        switch (activeComponent) {
            case "users":
                return <UsersManager />;
            case "products":
                return <ProductManager />;
            case "gallery":
                return <GalleryManager />;
            case "contact":
                return <ContactManager />;
            case "orders":
                return <OrderManager refreshOrders={() => setLastOrderCount(0)} />;
            case "messages":
                return <AdminMessage />;
            default:
                return <DashboardHome user={user} setActiveComponent={setActiveComponent} isMobile={isMobile} />;
        }
    };

    return (
        <div className="h-screen w-full flex bg-gray-100 overflow-hidden">
            <SideNav active={activeComponent} setActive={setActiveComponent} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-md z-10">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <h1 className="text-xl font-bold text-blue-800">
                            {activeComponent.charAt(0).toUpperCase() + activeComponent.slice(1)}
                        </h1>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <main className={`flex-1 overflow-y-auto bg-gray-50 ${isMobile ? 'pb-24' : ''}`}>
                    {renderComponent()}
                </main>
            </div>
        </div>
    );
};

const DashboardHome = ({ user, setActiveComponent, isMobile }) => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        fetchDashboardStats();
    }, []);
    
    const fetchDashboardStats = async () => {
        setIsLoading(true);
        try {
            // Fetch products count
            const productsResponse = await axios.get(
                import.meta.env.MODE === "development" ? "http://localhost:5000/api/products" : "/api/products", 
                { withCredentials: true }
            );
            
            // Fetch orders
            const ordersResponse = await axios.get(
                import.meta.env.MODE === "development" ? "http://localhost:5000/api/orders" : "/api/orders", 
                { withCredentials: true }
            );
            
            // Fetch users
            const usersResponse = await axios.get(
                import.meta.env.MODE === "development" ? "http://localhost:5000/api/users" : "/api/users", 
                { withCredentials: true }
            );
            
            // Calculate total revenue
            const totalRevenue = ordersResponse.data
                .filter(order => order.status !== "Cancelled")
                .reduce((sum, order) => sum + order.total, 0);
                
            // Get orders from last month
            const lastMonthOrders = ordersResponse.data.filter(order => {
                const orderDate = new Date(order.createdAt);
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                return orderDate >= lastMonth;
            });
            
            // Calculate changes
            const lastMonthRevenue = lastMonthOrders
                .filter(order => order.status !== "Cancelled")
                .reduce((sum, order) => sum + order.total, 0);
                
            const revenueChange = totalRevenue > 0 
                ? `+${((lastMonthRevenue / totalRevenue) * 100).toFixed(0)}%` 
                : '+0%';
                
            const orderChange = ordersResponse.data.length > 0 
                ? `+${((lastMonthOrders.length / ordersResponse.data.length) * 100).toFixed(0)}%` 
                : '+0%';
            
            setStats([
                { 
                    label: "Total Orders", 
                    value: ordersResponse.data.length.toString(), 
                    change: orderChange, 
                    changeType: "positive" 
                },
                { 
                    label: "Revenue", 
                    value: `${totalRevenue.toFixed(2)}`, 
                    change: revenueChange, 
                    changeType: "positive" 
                },
                { 
                    label: "Products", 
                    value: productsResponse.data.length.toString(), 
                    change: `+${productsResponse.data.length > 0 ? productsResponse.data.length : 0}`, 
                    changeType: "positive" 
                },
                { 
                    label: "Users", 
                    value: usersResponse.data.length.toString(), 
                    change: `+${usersResponse.data.length > 0 ? usersResponse.data.length : 0}`, 
                    changeType: "positive" 
                },
            ]);
        } catch (error) {
            console.error("Error fetching dashboard statistics:", error);
            toast.error("Failed to load dashboard statistics");
            
            // Set fallback stats
            setStats([
                { label: "Total Orders", value: "0", change: "0%", changeType: "neutral" },
                { label: "Revenue", value: "0.00", change: "0%", changeType: "neutral" },
                { label: "Products", value: "0", change: "0", changeType: "neutral" },
                { label: "Users", value: "0", change: "0", changeType: "neutral" },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {stats && stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-medium text-gray-700">{stat.label}</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                        <div className="flex items-center mt-2">
                            <p className={`text-sm ${stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                                {stat.change} since last month
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Welcome Back, {user.name}!</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Joined</p>
                        <p className="font-medium">{formatDate(user.createdAt)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Last Login</p>
                        <p className="font-medium">{formatDate(user.lastLogin)}</p>
                    </div>
                </div>
            </div>

            <div className={`bg-white p-6 rounded-lg shadow-md ${isMobile ? 'mb-20' : ''}`}>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setActiveComponent("orders")}
                        className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg flex flex-col items-center justify-center transition-colors"
                    >
                        <span className="text-blue-800 font-medium">Manage Orders</span>
                    </button>
                    <button 
                        onClick={() => setActiveComponent("products")}
                        className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg flex flex-col items-center justify-center transition-colors"
                    >
                        <span className="text-blue-800 font-medium">Add Products</span>
                    </button>
                    <button 
                        onClick={() => setActiveComponent("gallery")}
                        className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg flex flex-col items-center justify-center transition-colors"
                    >
                        <span className="text-blue-800 font-medium">Update Gallery</span>
                    </button>
                    <button 
                        onClick={() => setActiveComponent("contact")}
                        className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg flex flex-col items-center justify-center transition-colors"
                    >
                        <span className="text-blue-800 font-medium">Contact Info</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;