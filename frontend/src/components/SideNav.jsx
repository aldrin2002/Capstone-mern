import React from "react";
import { Users, ShoppingBag, Image, Phone, ShoppingCart, Home, LogOut } from "lucide-react";
import { useAuthStore } from "../store/authStore";

const SideNav = ({ active, setActive }) => {
    const { logout } = useAuthStore();

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: Home },
        { id: "users", label: "Users", icon: Users },
        { id: "products", label: "Products", icon: ShoppingBag },
        { id: "gallery", label: "Gallery", icon: Image },
        { id: "contact", label: "Contact", icon: Phone },
        { id: "orders", label: "Orders", icon: ShoppingCart },
    ];

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="h-screen w-64 bg-blue-800 bg-opacity-90 backdrop-filter backdrop-blur-lg text-white flex flex-col shadow-xl">
            <div className="p-6 border-b border-blue-700">
                <h2 className="text-2xl font-bold text-white">Cafe<span className="text-blue-300">X</span></h2>
                <p className="text-sm text-blue-300 mt-1">Admin Dashboard</p>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-2 px-4">
                    {navItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                            <li key={item.id}>
                                <button 
                                    onClick={() => setActive(item.id)}
                                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors duration-200 
                                    ${active === item.id 
                                        ? "bg-blue-600 text-white" 
                                        : "text-blue-200 hover:bg-blue-700"}`}
                                >
                                    <IconComponent className="w-5 h-5 mr-3" />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
            
            <div className="p-4 border-t border-blue-700">
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 text-blue-200 hover:bg-blue-700 rounded-lg transition-colors duration-200"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default SideNav;
