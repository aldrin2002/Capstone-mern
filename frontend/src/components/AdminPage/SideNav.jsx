import { useState, useEffect } from "react";
import { Users, ShoppingBag, Image, Phone, ShoppingCart, Home, LogOut, Plus } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

const SideNav = ({ active, setActive }) => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isExpanded, setIsExpanded] = useState(false);

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: Home },
        { id: "users", label: "Users", icon: Users },
        { id: "products", label: "Products", icon: ShoppingBag },
        { id: "gallery", label: "Gallery", icon: Image },
        { id: "contact", label: "Contact", icon: Phone },
        { id: "orders", label: "Orders", icon: ShoppingCart },
    ];

    // Handle logout
    const handleLogout = () => {
        logout();
        navigate("/LandingPage");
    };

    // Toggle floating menu expansion
    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Mobile view
    if (isMobile) {
        return (
            <>
                {/* Floating Expandable Button */}
                <div className="fixed right-4 bottom-20 z-50 flex flex-col-reverse items-center space-y-reverse space-y-2">
                    {/* Logout Button - Only visible when expanded */}
                    {isExpanded && (
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-all transform animate-fadeIn"
                        >
                            <LogOut size={24} />
                        </button>
                    )}
                    
                    {/* Main Toggle Button */}
                    <button
                        onClick={toggleExpand}
                        className={`p-4 rounded-full shadow-lg transition-all transform ${
                            isExpanded 
                                ? "bg-gray-700 text-white rotate-45" 
                                : "bg-blue-600 text-white"
                        }`}
                    >
                        <Plus size={24} />
                    </button>
                </div>
                
                {/* Bottom Navigation */}
                <div className="fixed bottom-0 left-0 right-0 bg-blue-800 text-white z-40 shadow-lg">
                    <div className="flex justify-around items-center h-16">
                        {navItems.map((item) => {
                            const IconComponent = item.icon;
                            return (
                                <button 
                                    key={item.id} 
                                    onClick={() => setActive(item.id)}
                                    className={`flex flex-col items-center justify-center w-full h-full ${
                                        active === item.id ? "text-blue-300" : "text-white"
                                    }`}
                                >
                                    <IconComponent className="h-5 w-5 mb-1" />
                                    <span className="text-xs">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </>
        );
    }

    // Desktop view
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
