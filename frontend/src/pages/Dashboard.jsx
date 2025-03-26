import { useAuthStore } from "../store/authStore";
import React, { useState, useEffect } from "react";
import SideNav from "../components/SideNav";
import UsersManager from "../components/UsersManager";
import ProductManager from "../components/ProductManager";
import GalleryManager from "../components/GalleryManager";
import ContactManager from "../components/ContactManager";
import OrderManager from "../components/OrderManager";
import { User, Loader } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const DashboardPage = () => {
    const { user } = useAuthStore();
    const [activeComponent, setActiveComponent] = useState("dashboard");

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
                return <OrderManager />;
            default:
                return <DashboardHome user={user} setActiveComponent={setActiveComponent} />;
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
                <main className="flex-1 overflow-y-auto bg-gray-50">
                    {renderComponent()}
                </main>
            </div>
        </div>
    );
};

const DashboardHome = ({ user, setActiveComponent }) => {
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
                    value: `$${totalRevenue.toFixed(2)}`, 
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
                { label: "Revenue", value: "$0.00", change: "0%", changeType: "neutral" },
                { label: "Products", value: "0", change: "0", changeType: "neutral" },
                { label: "Users", value: "0", change: "0", changeType: "neutral" },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Not available";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (isLoading) {
        return (
            <div className="p-6 h-full flex justify-center items-center">
                <Loader className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                        <div className={`flex items-center mt-2 ${
                            stat.changeType === 'positive' ? 'text-green-600' : 
                            stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                            <span>{stat.change}</span>
                            <span className="text-xs ml-1">since last month</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Welcome Back, {user.name}!</h2>
                    <div className="border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
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
        </div>
    );
};

export default DashboardPage;