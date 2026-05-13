import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, ClipboardList, MessageCircle, LogOut, Truck, User, MapPin } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import axios from "axios";

const DriverSideNav = () => {
  const { logout, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isExpanded, setIsExpanded] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const apiUrl = import.meta.env.MODE === "development" ? "http://localhost:5000/api/contact" : "/api/contact";
    axios.get(apiUrl).then(res => setContactInfo(res.data)).catch(() => {});
  }, []);

  const navItems = [
    { path: "/driver-dashboard", label: "HOME", icon: <Home size={20} /> },
    { path: "/driver-orders", label: "ORDER NOTIFICATIONS", icon: <ClipboardList size={20} /> },
    { path: "/driver-messages", label: "MESSAGES", icon: <MessageCircle size={20} /> },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch {
      navigate("/");
    }
  };

  if (isMobile) {
    // Floating button + bottom bar (mirrors customer side)
    const bottomNavItems = navItems;

    return (
      <>
        {/* Floating expandable actions */}
        <div className="fixed right-4 bottom-32 z-50 flex flex-col-reverse items-center space-y-reverse space-y-4">
          {/* Logout */}
          {isExpanded && (
            <button
              onClick={handleLogout}
              className="p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <LogOut size={22} />
            </button>
          )}
          {/* Messages quick */}
          {isExpanded && (
            <Link
              to="/driver-messages"
              className="p-4 bg-gradient-to-r from-brand to-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <MessageCircle size={22} />
            </Link>
          )}
          {/* Toggle */}
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-4 bg-gradient-to-r from-brand to-primary-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all"
          >
            <Truck size={22} />
          </button>
        </div>

        {/* Bottom nav bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-primary-900 bg-opacity-90 backdrop-blur text-white border-t border-primary-700 z-40">
          <div className="flex items-center justify-around p-3">
            {bottomNavItems.map(item => {
              const active = location.pathname + location.hash === item.path || location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex flex-col items-center text-xs ${active ? "text-primary-200" : "text-white"} transition`}
                >
                  {item.icon}
                  <span className="mt-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </>
    );
  }

  // Desktop
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 z-20 bg-primary-900 bg-opacity-90 backdrop-blur text-white flex flex-col shadow-xl">
      <div className="p-6 border-b border-primary-700">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Truck className="w-6 h-6 text-primary-200" />
          Driver
        </h2>
        <p className="text-sm text-primary-200 mt-1 flex items-center gap-1">
          <User className="w-4 h-4" /> {user?.name || "Driver"}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(item => {
          const active = location.pathname + location.hash === item.path || location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                active
                  ? "bg-white/15 text-primary-100 border border-white/20"
                  : "hover:bg-white/10"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-primary-700/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-lg shadow-md transition"
        >
          <LogOut className="w-5 h-5" />
          <span>LOGOUT</span>
        </button>
      </div>
    </aside>
  );
};

export default DriverSideNav;