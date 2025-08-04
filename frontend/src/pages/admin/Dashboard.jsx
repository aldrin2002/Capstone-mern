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
import DashboardHome from "./DashboardHome";
import DashboardHeader from "./DashboardHeader";
import { useOrderNotifications } from "./useOrderNotification";

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

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Use custom hook for order notifications
  useOrderNotifications(
    lastOrderCount,
    setLastOrderCount,
    activeComponent,
    setActiveComponent
  );

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
        return (
          <DashboardHome
            user={user}
            setActiveComponent={setActiveComponent}
            isMobile={isMobile}
          />
        );
    }
  };

  return (
    <div className="h-screen w-full flex bg-gray-100 overflow-hidden">
      <SideNav active={activeComponent} setActive={setActiveComponent} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader activeComponent={activeComponent} user={user} />
        <main
          className={`flex-1 overflow-y-auto bg-gray-50 ${
            isMobile ? "pb-24" : ""
          }`}
        >
          {renderComponent()}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;