import { useState, useEffect } from "react";
import SideNav from "../components/AdminPage/SideNav";
import Dashboard from "../components/AdminPage/Dashboard";
import UsersManager from "../components/AdminPage/UsersManager";
import ProductManager from "../components/AdminPage/ProductManager";
import GalleryManager from "../components/AdminPage/GalleryManager";
import ContactManager from "../components/AdminPage/ContactManager";
import OrderManager from "../components/AdminPage/OrderManager";
import { useAuthStore } from "../store/authStore";
import { Navigate } from "react-router-dom";

const Admin = () => {
    const [active, setActive] = useState("dashboard");
    const { user } = useAuthStore();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Redirect if not admin
    if (!user || user.role !== "admin") {
        return <Navigate to="/login" />;
    }

    // Render active component
    const renderComponent = () => {
        switch (active) {
            case "dashboard":
                return <Dashboard />;
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
                return <Dashboard />;
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
            <SideNav active={active} setActive={setActive} />
            <div className={`flex-1 ${isMobile ? 'pb-32' : ''}`}>
                {renderComponent()}
            </div>
        </div>
    );
};

export default Admin; 