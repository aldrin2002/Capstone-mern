import { useState } from "react";
import { Mail, Lock, Loader, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

const CostumerLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { customerLogin, isLoading } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await customerLogin(email, password);
      
      // Show SweetAlert welcome message
      Swal.fire({
        title: "Welcome Customer!",
        text: "You have successfully logged in",
        icon: "success",
        confirmButtonText: "Continue to Dashboard",
        confirmButtonColor: "#3B82F6",
        background: "rgba(255, 255, 255, 0.9)",
        backdrop: `rgba(59, 130, 246, 0.4)`
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/customer-dashboard");
        }
      });
      
    } catch (error) {
      if (error.message === "Backend server not running. Please start the server.") {
        toast.error("Backend server not running. Please start the server.");
      } else {
        toast.error(error.response?.data?.message || "Invalid credentials. Please try again.");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700"
    >
      {/* Meteor Effect */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className={`absolute h-0.5 w-0.5 ${
              i % 2 === 0 ? 'animate-meteor' : 'animate-meteor-slow'
            }`}
            style={{
              top: `${Math.random() * -20}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            <div 
              className="absolute h-0.5 w-[100px] bg-gradient-to-r from-white to-transparent"
            />
          </div>
        ))}
      </div>

      <div className="max-w-md w-full mx-4 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg overflow-hidden border border-gray-200 relative z-10">
        <div className="p-8">
          <h2 className="text-3xl font-bold mb-6 text-center text-white">
            Welcome Customer!
          </h2>
          <div className="h-1 w-20 bg-blue-500 mx-auto mb-8"></div>

          <form onSubmit={handleLogin}>
            <Input
              icon={Mail}
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative mb-4">
              <Input
                icon={Lock}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={18} className="text-blue-300" />
                ) : (
                  <Eye size={18} className="text-blue-300" />
                )}
              </button>
            </div>
            <button
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <Loader className="w-6 h-6 animate-spin mx-auto" /> : "Login"}
            </button>
          </form>
        </div>
        <div className="px-8 py-4 bg-gray-50 bg-opacity-20 flex justify-center">
          <p className="text-sm text-white">
            Don't have an account?{" "}
            <Link to="/costumerSignup" className="text-blue-300 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CostumerLoginPage;