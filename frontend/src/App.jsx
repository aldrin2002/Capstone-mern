import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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
import { useEffect } from "react";
import CustomerAboutUs from "./components/CustomerPage/customerAboutUs";
import CustomerMenu from "./components/CustomerPage/customerMenu";
import CustomerBuy from "./components/CustomerPage/customerBuy";
import CustomerContact from "./components/CustomerPage/customerContact";
import CustomerMessage from "./components/CustomerPage/customerMessage";
import AdminMessage from './components/AdminPage/AdminMessage';
import CustomerOrders from './components/CustomerPage/CustomerOrders';

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

// Protect routes based on authentication and role
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, isCheckingAuth } = useAuthStore();
  const location = useLocation();

  if (isCheckingAuth) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Role-based access control
  if (location.pathname.startsWith("/dashboard") && user?.role !== "admin") {
    return <Navigate to="/customer-dashboard" replace />;
  }

  if (location.pathname.startsWith("/customer-dashboard") && user?.role !== "customer") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Prevent authenticated users from accessing auth pages
const AuthRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  if (isAuthenticated) {
    const redirectPath = user?.role === "admin" ? "/dashboard" : "/customer-dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

function App() {
  const { isCheckingAuth, checkAuth } = useAuthStore();

  useEffect(() => {
    // Check for token in localStorage and log its status
    const token = localStorage.getItem('token');
    console.log("App initialization - Token status:", token ? "Available" : "Not available");
    
    checkAuth();
  }, []);

  if (isCheckingAuth) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              <LoginPage />
            </AuthRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <AuthRoute>
              <SignUpPage />
            </AuthRoute>
          }
        />
        <Route
          path="/costumerLogin"
          element={
            <AuthRoute>
              <CostumerLoginPage />
            </AuthRoute>
          }
        />
        <Route
          path="/costumerSignup"
          element={
            <AuthRoute>
              <CostumerSignUpPage />
            </AuthRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-dashboard"
          element={
            <ProtectedRoute>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-about"
          element={
            <ProtectedRoute>
              <CustomerAboutUs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-gallery"
          element={
            <ProtectedRoute>
              <CustomerGallery />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-menu"
          element={
            <ProtectedRoute>
              <CustomerMenu />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-buy"
          element={
            <ProtectedRoute>
              <CustomerBuy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-contact"
          element={
            <ProtectedRoute>
              <CustomerContact />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-messages"
          element={
            <ProtectedRoute>
              <CustomerMessage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-message"
          element={
            <ProtectedRoute>
              <CustomerMessage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/messages"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" state={{ activeTab: "messages" }} replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-orders"
          element={
            <ProtectedRoute>
              <CustomerOrders />
            </ProtectedRoute>
          }
        />

        {/* Catch-All Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
