import { Loader, Lock, Mail, User, Phone } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import PasswordStrengthMeter from "../../components/PasswordStrengthMeter";
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import AddressAutocomplete from "../../components/Map/AddressAutoComplete";
import AddressPickerMap from "../../components/Map/AddressPickerMap";

const CostumerSignUpPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [locationCoords, setLocationCoords] = useState(null);
  
  const navigate = useNavigate();
  const { customerSignup, error, isLoading } = useAuthStore();

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (/^[a-zA-Z\s]*$/.test(value)) {
      setName(value);
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      if (value.length <= 11) {
        setPhone(value);
      }
    }
  };

  const handleAddressSelect = (addressData) => {
    if (addressData) {
      setAddress(addressData.address);
      setLocationCoords({
        lat: addressData.lat,
        lng: addressData.lng
      });
    } else {
      setAddress("");
      setLocationCoords(null);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!email || !password || !name || !phone || !address) {
      toast.error("All fields are required");
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      toast.error("Full name should only contain letters and spaces");
      return;
    }

    if (phone.length !== 11) {
      toast.error("Phone number must be exactly 11 digits");
      return;
    }

    if (!phone.startsWith("09")) {
      toast.error("Phone number must start with 09 (e.g., 09123456789)");
      return;
    }

    if (!locationCoords || !locationCoords.lat || !locationCoords.lng) {
      toast.error("Please select your address from the suggestions");
      return;
    }

    try {
      await customerSignup(email, password, name, phone, address, locationCoords);
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
      className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700 p-4 sm:p-6 lg:p-8 overflow-y-auto"
    >
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-4xl bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg overflow-hidden border border-gray-200 my-8">
        <div className="p-4 sm:p-6 md:p-8 lg:p-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center text-white mb-2 sm:mb-4">
            Create Customer Account
          </h2>
          <div className="h-1 w-12 sm:w-16 md:w-20 lg:w-24 bg-blue-500 mx-auto mb-4 sm:mb-6 md:mb-8"></div>

          <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4 md:space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ✨ LEFT COLUMN - All Form Inputs */}
              <div className="space-y-3">
                <Input
                  icon={User}
                  type="text"
                  placeholder="Full Name (letters only)"
                  value={name}
                  onChange={handleNameChange}
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
                  placeholder="Phone Number (09XXXXXXXXX)"
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={11}
                />

                {/* ✨ MOVED: Address Autocomplete to Left Column */}
                <div className="relative z-50">
                  <AddressAutocomplete 
                    onAddressSelect={handleAddressSelect}
                    placeholder="Type your address (e.g., 'Makati City, Philippines')"
                  />
                </div>
                
                {error && (
                  <p className="text-red-500 font-semibold text-xs sm:text-sm mt-2">
                    {error}
                  </p>
                )}
                
                <div className="mt-2 sm:mt-3 md:mt-4">
                  <PasswordStrengthMeter password={password} />
                </div>
              </div>

              {/* ✨ RIGHT COLUMN - Map Only */}
              <div className="space-y-3 relative z-10">
                <label className="block text-sm font-medium text-white mb-2">
                  📍 Delivery Location Preview
                </label>
                <AddressPickerMap 
                  coordinates={locationCoords}
                  selectedAddress={address}
                />
                <p className="text-xs text-white/80 mt-2">
                  💡 Select your address from the search results to pin the location
                </p>
              </div>
            </div>

            <button
              className="w-full py-2 sm:py-3 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md 
                        hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        transition duration-200 text-xs sm:text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader className="animate-spin mx-auto" size={24} />
              ) : (
                "Create Account"
              )}
            </button>

            {/* Terms and Privacy */}
            <div className="text-center mt-3">
              <p className="text-xs text-white">
                By signing up, you agree to our{" "}
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

export default CostumerSignUpPage;
