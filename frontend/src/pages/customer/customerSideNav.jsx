import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { Home, Info, Image, Coffee, Phone, ShoppingBag, LogOut, Plus } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import logoImage from "../../assets/1.png";

const CustomerSideNav = () => {
    const [contactInfo, setContactInfo] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isExpanded, setIsExpanded] = useState(false);
    const location = useLocation();
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    // Check if current route is active
    const isActive = (path) => location.pathname === path;

    // Handle logout
    const handleLogout = async () => {
        await logout();
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

    // Fetch contact information
    const fetchContactInfo = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/contact");
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
    ];

    // Mobile bottom navigation
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
                    
                    {/* Buy Button - Only visible when expanded */}
                    {isExpanded && (
                        <Link 
                            to="/customer-buy"
                            className="bg-yellow-500 text-blue-900 p-3 rounded-full shadow-lg hover:bg-yellow-600 transition-all transform animate-fadeIn"
                        >
                            <ShoppingBag size={24} />
                        </Link>
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
                <div className="fixed bottom-0 left-0 right-0 bg-blue-900 text-white z-40">
                    <div className="flex justify-around items-center h-16">
                        {navItems.map((item) => (
                            <Link 
                                key={item.path} 
                                to={item.path}
                                className={`flex flex-col items-center justify-center w-full h-full ${
                                    isActive(item.path) ? "text-yellow-400" : "text-white"
                                }`}
                            >
                                <div className="mb-1">{item.icon}</div>
                                <span className="text-xs">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </>
        );
    }

    // Desktop sidebar
    return (
        <aside className="w-64 bg-blue-900 text-white flex flex-col justify-between">
            <div className="p-6">
                {/* Logo */}
                <div className="mb-8">
                    <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                        <img 
                            src={logoImage} 
                            alt="CafeX Logo"
                            className="w-full h-full object-contain rounded-full" 
                        />
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-4">
                    {navItems.map((item) => (
                        <Link 
                            key={item.path} 
                            to={item.path} 
                            className={`flex items-center text-lg hover:text-gray-300 ${
                                isActive(item.path) ? "text-yellow-400" : ""
                            }`}
                        >
                            <span className="mr-3">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Button */}
                <div className="mt-8">
                    <Link to="/customer-buy" className="block w-full">
                        <button className="w-full bg-yellow-500 text-blue-900 font-bold py-2 px-4 rounded hover:bg-yellow-600 flex items-center justify-center">
                            <ShoppingBag className="mr-2" size={18} />
                            BUY NOW &gt;
                        </button>
                    </Link>
                </div>
                
                {/* Logout Button */}
                <div className="mt-4">
                    <button 
                        onClick={handleLogout}
                        className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-600 flex items-center justify-center"
                    >
                        <LogOut className="mr-2" size={18} />
                        LOGOUT
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 text-sm">
                {contactInfo ? (
                    <>
                        <p>{contactInfo.address}</p>
                        <p className="mt-4">{contactInfo.hours}</p>
                        <p className="mt-2">{contactInfo.phone}</p>
                        <p className="mt-2">{contactInfo.email}</p>
                    </>
                ) : (
                    <p>Loading contact information...</p>
                )}
            </div>
        </aside>
    );
};

export default CustomerSideNav;