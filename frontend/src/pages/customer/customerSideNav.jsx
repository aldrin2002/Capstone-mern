import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { Home, Info, Image, Coffee, Phone, ShoppingBag, LogOut, Plus, MessageCircle, ShoppingCart } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import logoImage from "../../assets/cafe-delicity-logo.jpg";
import Swal from "sweetalert2";
import { useCustomerMessages } from "../../context/CustomerMessageContext";

// Export this constant to be used by other components
export const MOBILE_NAV_HEIGHT = 64; // 16 * 4 = 64px (4rem)

const CustomerSideNav = () => {
    const [contactInfo, setContactInfo] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isExpanded, setIsExpanded] = useState(false);
    const location = useLocation();
    const { logout } = useAuthStore();
    const navigate = useNavigate();
    const { unreadCount } = useCustomerMessages();

    // Check if current route is active
    const isActive = (path) => location.pathname === path;

    // Handle logout with SweetAlert
    const handleLogout = () => {
        Swal.fire({
            title: "Are you sure?",
            text: "You will be logged out of your account",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#F13E93",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, logout",
            background: "rgba(255, 255, 255, 0.9)",
            backdrop: `rgba(241, 62, 147, 0.4)`
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

    // Fetch contact information
    const fetchContactInfo = async () => {
        try {
            const apiUrl = import.meta.env.MODE === "development" 
                ? "http://localhost:5000/api/contact" 
                : "/api/contact";
            const response = await axios.get(apiUrl);
            setContactInfo(response.data);
        } catch (error) {
            console.error("Error fetching contact information:", error);
        }
    };

    useEffect(() => {
        fetchContactInfo();
    }, []);

    // Navigation items with icons
    const navItems = [
        { path: "/customer-dashboard", label: "HOME", icon: <Home size={20} /> },
        { path: "/customer-about", label: "ABOUT", icon: <Info size={20} /> },
        { path: "/customer-gallery", label: "GALLERY", icon: <Image size={20} /> },
        { path: "/customer-menu", label: "MENU", icon: <Coffee size={20} /> },
        { path: "/customer-contact", label: "CONTACT", icon: <Phone size={20} /> },
        { path: "/customer-messages", label: "MESSAGES", icon: <MessageCircle size={20} /> },
        { path: "/customer-orders", label: "MY ORDERS", icon: <ShoppingBag size={20} /> },
    ];

    // Mobile bottom navigation
    if (isMobile) {
        // Define basic navigation items for bottom bar (excluding Messages and Orders)
        const bottomNavItems = navItems.filter(item => 
            item.label !== "MESSAGES" && item.label !== "MY ORDERS"
        );
        
        return (
            <>
                {/* Enhanced Floating Expandable Button */}
                <div className="fixed right-4 bottom-32 z-50 flex flex-col-reverse items-center space-y-reverse space-y-4">
                    {/* Logout Button - Enhanced with animation */}
                    {isExpanded && (
                        <button
                            onClick={handleLogout}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform animate-fadeIn hover:scale-110"
                        >
                            <LogOut size={24} />
                        </button>
                    )}
                    
                    {/* Messages Button - Enhanced */}
                    {isExpanded && (
                        <Link 
                            to="/customer-messages"
                            className="bg-gradient-to-r from-brand to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform animate-fadeIn hover:scale-110 relative"
                        >
                            <MessageCircle size={24} />
                            {unreadCount > 0 && (
                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                </div>
                            )}
                        </Link>
                    )}
                    
                    {/* Orders Button - Enhanced */}
                    {isExpanded && (
                        <Link 
                            to="/customer-orders"
                            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform animate-fadeIn hover:scale-110"
                        >
                            <ShoppingBag size={24} />
                        </Link>
                    )}
                    
                    {/* Buy Button - Enhanced */}
                    {isExpanded && (
                        <Link 
                            to="/customer-buy"
                            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-gray-900 p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform animate-fadeIn hover:scale-110"
                        >
                            <ShoppingCart size={24} />
                        </Link>
                    )}
                    
                    {/* Enhanced Main Toggle Button */}
                    <button
                        onClick={toggleExpand}
                        className={`p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform ${
                            isExpanded 
                                ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white rotate-45 scale-110" 
                                : "bg-gradient-to-r from-brand to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white hover:scale-110"
                        }`}
                    >
                        <Plus size={24} />
                    </button>
                </div>
                
                {/* Enhanced Bottom Navigation */}
                <div 
                    className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-primary-800 via-primary-900 to-primary-900 text-white z-40 backdrop-blur-sm border-t border-primary-700/50"
                    style={{ height: `${MOBILE_NAV_HEIGHT}px` }}
                >
                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-600/20 to-transparent"></div>
                    
                    <div className="relative flex justify-around items-center h-full">
                        {bottomNavItems.map((item) => (
                            <Link 
                                key={item.path} 
                                to={item.path}
                                className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 transform ${
                                    isActive(item.path) 
                                        ? "text-amber-400 scale-110" 
                                        : "text-white hover:text-primary-200 hover:scale-105"
                                }`}
                            >
                                {/* Active indicator */}
                                {isActive(item.path) && (
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full"></div>
                                )}
                                
                                <div className="mb-1 transition-transform duration-300">
                                    {item.icon}
                                </div>
                                <span className="text-xs font-medium">{item.label}</span>
                                
                                {/* Ripple effect for active item */}
                                {isActive(item.path) && (
                                    <div className="absolute inset-0 bg-amber-400/10 rounded-lg animate-pulse"></div>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            </>
        );
    }

    // FIXED Desktop sidebar - NO SCROLLING
    return (
        <aside className="fixed left-0 top-0 w-64 h-screen bg-gradient-to-b from-primary-800 via-primary-900 to-primary-900 text-white z-20 shadow-2xl">
            {/* Logo Section - Fixed at top */}
            <div className="p-6 border-b border-primary-700/50">
                <div className="text-center">
                    <div className="relative mx-auto mb-4 w-16 h-16">
                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
                            <img src={logoImage} alt="Cafe X Logo" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <h1 className="text-xl font-bold text-white">CafeX</h1>
                    <p className="text-primary-200 text-sm">Customer Portal</p>
                </div>
            </div>

            {/* Navigation Links - Scrollable middle section */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                <nav className="space-y-2">
                    {navItems.map((item) => (
                        <Link 
                            key={item.path} 
                            to={item.path} 
                            className={`group relative flex items-center text-sm font-medium transition-all duration-200 ${
                                isActive(item.path) 
                                    ? "text-amber-400 bg-white/10" 
                                    : "text-white hover:text-primary-200 hover:bg-white/5"
                            } p-3 rounded-lg`}
                        >
                            {/* Active indicator */}
                            {isActive(item.path) && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-r-full"></div>
                            )}
                            
                            <span className="mr-3">
                                {item.icon}
                            </span>
                            
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                    <Link to="/customer-buy" className="block w-full">
                        <button className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center">
                            <ShoppingBag className="mr-2" size={18} />
                            <span>BUY NOW</span>
                        </button>
                    </Link>
                    
                    <button 
                        onClick={handleLogout}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
                    >
                        <LogOut className="mr-2" size={18} />
                        <span>LOGOUT</span>
                    </button>
                </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="p-4 border-t border-primary-700/50 bg-primary-900/50">
                <div className="bg-white/5 rounded-lg p-3">
                    {contactInfo ? (
                        <div className="space-y-1 text-xs text-primary-200">
                            <div className="flex items-start">
                                <div className="w-1 h-1 bg-primary-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                                <p className="leading-tight">{contactInfo.address}</p>
                            </div>
                            <div className="flex items-center">
                                <div className="w-1 h-1 bg-green-400 rounded-full mr-2 flex-shrink-0"></div>
                                <p>{contactInfo.hours}</p>
                            </div>
                            <div className="flex items-center">
                                <div className="w-1 h-1 bg-yellow-400 rounded-full mr-2 flex-shrink-0"></div>
                                <p>{contactInfo.phone}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center text-xs text-primary-200">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-primary-400 mr-2"></div>
                            <p>Loading...</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default CustomerSideNav;