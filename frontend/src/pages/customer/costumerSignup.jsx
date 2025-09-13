import { Loader, Lock, Mail, User, Phone } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import PasswordStrengthMeter from "../../components/PasswordStrengthMeter";
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

const CostumerSignUpPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  const { customerSignup, error, isLoading } = useAuthStore();

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!email || !password || !name || !phone) {
      toast.error("All fields are required");
      return;
    }

    try {
      await customerSignup(email, password, name, phone);
      toast.success("Account created successfully!");
      navigate("/costumerLogin");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create account");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700 p-4 sm:p-6 lg:p-8"
    >
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="p-4 sm:p-6 md:p-8 lg:p-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center text-white mb-2 sm:mb-4">
            Create Customer Account
          </h2>
          <div className="h-1 w-12 sm:w-16 md:w-20 lg:w-24 bg-blue-500 mx-auto mb-4 sm:mb-6 md:mb-8"></div>

          <form
            onSubmit={handleSignUp}
            className="space-y-3 sm:space-y-4 md:space-y-5"
          >
            <Input
              icon={User}
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              icon={Mail}
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              icon={Lock}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              icon={Phone}
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {error && (
              <p className="text-red-500 font-semibold text-xs sm:text-sm mt-2 mb-2">
                {error}
              </p>
            )}
            <div className="mt-2 sm:mt-3 md:mt-4">
              <PasswordStrengthMeter password={password} />
            </div>

            <button
              className="mt-4 sm:mt-5 md:mt-6 w-full py-2 sm:py-3 md:py-3 lg:py-4 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md 
                            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                            transition duration-200 text-sm sm:text-base md:text-lg"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader className="animate-spin mx-auto" size={20} />
              ) : (
                "Sign Up"
              )}
            </button>

            {/* Terms & Conditions and Privacy Policy Text */}
            <div className="mt-3 sm:mt-4 md:mt-5">
              <p className="text-xs sm:text-sm text-white text-center leading-relaxed">
                By clicking "Sign Up", you agree to our{" "}
                <Link
                  to="/terms-conditions"
                  className="text-blue-200 hover:text-blue-100 underline font-medium transition-colors duration-200"
                >
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy-policy"
                  className="text-blue-200 hover:text-blue-100 underline font-medium transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </form>
        </div>
        <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4 md:py-4 lg:py-5 bg-gray-50 bg-opacity-20 flex justify-center">
          <p className="text-xs sm:text-sm md:text-base text-white text-center">
            Already have an account?{" "}
            <Link
              to="/costumerLogin"
              className="text-blue-300 font-medium hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CostumerSignUpPage; // Fixed export name
