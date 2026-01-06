import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import SignUpPage from "./pages/admin/SignupPage";
import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/Dashboard";
import CostumerLoginPage from "./pages/customer/costumerLogin";
import CostumerSignUpPage from "./pages/customer/costumerSignup";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import LandingPage from "./pages/LandingPage"; // Add this import
import CustomerGallery from "./components/CustomerPage/customerGallery";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import CustomerAboutUs from "./components/CustomerPage/customerAboutUs";
import CustomerMenu from "./components/CustomerPage/customerMenu";
import CustomerBuy from "./components/CustomerPage/customerBuy";
import CustomerContact from "./components/CustomerPage/customerContact";
import CustomerMessage from "./components/CustomerPage/customerMessage";
import AdminMessage from './components/AdminPage/AdminMessage';
import CustomerOrders from './components/CustomerPage/CustomerOrders';
import { MessageNotificationProvider } from "./context/MessageNotificationContext";
import { CustomerMessageProvider } from "./context/CustomerMessageContext";
import PrivacyPolicy from './pages/customer/PrivacyPolicy';
import TermsAndConditions from './pages/customer/Terms&Conditions';
import DriverLoginPage from "./pages/driver/driverLogin";
import DriverSignUpPage from "./pages/driver/driverSignup";
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverOrdersPage from "./components/DriverPage/OrderNotification"; // ✅ NEW
import DriverMessages from "./components/DriverPage/DriverMessages";

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

// Helper: home path per role
const homeForRole = (role) => {
  if (role === "admin") return "/dashboard";
  if (role === "customer") return "/customer-dashboard";
  if (role === "driver") return "/driver-dashboard";
  return "/"; // fallback
};

// Protect routes based on authentication and role
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, isCheckingAuth } = useAuthStore();
  const location = useLocation();

  if (isCheckingAuth) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/" replace state={{ from: location }} />;

  // Role-based access control: redirect to that role’s home, not a different dashboard
  const path = location.pathname;

  // Admin-only pages
  if ((path.startsWith("/dashboard") || path.startsWith("/admin")) && user?.role !== "admin") {
    return <Navigate to={homeForRole(user?.role)} replace />;
  }

  // Customer-only pages
  if (path.startsWith("/customer-") && user?.role !== "customer") {
    return <Navigate to={homeForRole(user?.role)} replace />;
  }

  // Driver-only pages (covers /driver-dashboard, /driver-orders, /driver-messages, etc.)
  if (path.startsWith("/driver-") && user?.role !== "driver") {
    return <Navigate to={homeForRole(user?.role)} replace />;
  }

  return children;
};

// Prevent authenticated users from accessing auth pages
const AuthRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  if (isAuthenticated) {
    const redirectPath = homeForRole(user?.role) || from;
    return <Navigate to={redirectPath} replace />;
  }
  return children;
};

function App() {
  const { isCheckingAuth, checkAuth } = useAuthStore();

  // StrictMode-safe one-time init to avoid update-depth loops
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const token = localStorage.getItem("token");
    console.log("App initialization - Token status:", token ? "Available" : "Not available");
    checkAuth();
  }, []);

  if (isCheckingAuth) return <LoadingSpinner />;

  return (
    <MessageNotificationProvider>
      <CustomerMessageProvider>
        <div className="min-h-screen bg-white">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />

            {/* Legal Pages */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsAndConditions />} />

            {/* Auth Routes */}
            <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
            <Route path="/signup" element={<AuthRoute><SignUpPage /></AuthRoute>} />
            <Route path="/costumerLogin" element={<AuthRoute><CostumerLoginPage /></AuthRoute>} />
            <Route path="/costumerSignup" element={<AuthRoute><CostumerSignUpPage /></AuthRoute>} />
            <Route path="/driverLogin" element={<AuthRoute><DriverLoginPage /></AuthRoute>} />
            <Route path="/driverSignup" element={<AuthRoute><DriverSignUpPage /></AuthRoute>} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/customer-dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
            <Route path="/customer-about" element={<ProtectedRoute><CustomerAboutUs /></ProtectedRoute>} />
            <Route path="/customer-gallery" element={<ProtectedRoute><CustomerGallery /></ProtectedRoute>} />
            <Route path="/customer-menu" element={<ProtectedRoute><CustomerMenu /></ProtectedRoute>} />
            <Route path="/customer-buy" element={<ProtectedRoute><CustomerBuy /></ProtectedRoute>} />
            <Route path="/customer-contact" element={<ProtectedRoute><CustomerContact /></ProtectedRoute>} />
            <Route path="/customer-messages" element={<ProtectedRoute><CustomerMessage /></ProtectedRoute>} />
            <Route path="/customer-message" element={<ProtectedRoute><CustomerMessage /></ProtectedRoute>} />
            <Route path="/admin/messages" element={<ProtectedRoute><Navigate to="/dashboard" state={{ activeTab: "messages" }} replace /></ProtectedRoute>} />
            <Route path="/customer-orders" element={<ProtectedRoute><CustomerOrders /></ProtectedRoute>} />
            <Route path="/driver-dashboard" element={<ProtectedRoute><DriverDashboard /></ProtectedRoute>} />
            <Route path="/driver-orders" element={<ProtectedRoute><DriverOrdersPage /></ProtectedRoute>} />
            <Route path="/driver-messages" element={<ProtectedRoute><DriverMessages /></ProtectedRoute>} />

            {/* Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-center" />
        </div>
      </CustomerMessageProvider>
    </MessageNotificationProvider>
  );
}

export default App;
