import { useState, useEffect } from "react";
import { Users, ShoppingBag, Image, Phone, ShoppingCart, Home, LogOut, Plus, MessageSquare } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2"; // Add this import

const SideNav = ({ active, setActive }) => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isExpanded, setIsExpanded] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0); // Example state for unread messages

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: Home },
        { id: "users", label: "Users", icon: Users },
        { id: "products", label: "Products", icon: ShoppingBag },
        { id: "gallery", label: "Gallery", icon: Image },
        { id: "contact", label: "Contact", icon: Phone },
        { id: "orders", label: "Orders", icon: ShoppingCart },
        { id: "messages", label: "Messages", icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : null },
    ];

    // Mobile navigation items (without Messages and Contact)
    const mobileNavItems = [
        { id: "dashboard", label: "Dashboard", icon: Home },
        { id: "users", label: "Users", icon: Users },
        { id: "products", label: "Products", icon: ShoppingBag },
        { id: "gallery", label: "Gallery", icon: Image },
        { id: "orders", label: "Orders", icon: ShoppingCart },
    ];

    // Handle logout with SweetAlert confirmation
    const handleLogout = () => {
        Swal.fire({
            title: "Are you sure?",
            text: "You will be logged out of your account",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, logout",
            background: "rgba(255, 255, 255, 0.9)",
            backdrop: `rgba(0, 0, 123, 0.4)`
        }).then((result) => {
            if (result.isConfirmed) {
                logout();
                Swal.fire({
                    title: "Logged Out!",
                    text: "You have been successfully logged out",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    navigate("/LandingPage");
                });
            }
        });
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
                <div className="fixed left-4 bottom-28 z-50 flex flex-col-reverse items-center space-y-reverse space-y-4">
                    {/* Logout Button - Only visible when expanded */}
                    {isExpanded && (
                        <>
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-all transform animate-fadeIn"
                                aria-label="Logout"
                            >
                                <LogOut size={24} />
                            </button>
                            
                            {/* Messages Button */}
                            <button
                                onClick={() => { 
                                    setActive("messages");
                                    setIsExpanded(false);
                                }}
                                className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all transform animate-fadeIn relative"
                                aria-label="Messages"
                            >
                                <MessageSquare size={24} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            
                            {/* Contact Button */}
                            <button
                                onClick={() => {
                                    setActive("contact");
                                    setIsExpanded(false);
                                }}
                                className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all transform animate-fadeIn"
                                aria-label="Contact"
                            >
                                <Phone size={24} />
                            </button>
                        </>
                    )}
                    
                    {/* Main Toggle Button */}
                    <button
                        onClick={toggleExpand}
                        className={`p-4 rounded-full shadow-lg transition-all transform ${
                            isExpanded 
                                ? "bg-gray-700 text-white rotate-45" 
                                : "bg-blue-600 text-white"
                        }`}
                        aria-label={isExpanded ? "Close menu" : "Open menu"}
                    >
                        <Plus size={24} />
                    </button>
                </div>
                
                {/* Bottom Navigation */}
                <div className="fixed bottom-0 left-0 right-0 bg-blue-800 text-white z-40 shadow-lg">
                    <div className="flex justify-around items-center h-16">
                        {mobileNavItems.map((item) => {
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
                                    {item.badge && (
                                        <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
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
                                    {item.badge && (
                                        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
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
