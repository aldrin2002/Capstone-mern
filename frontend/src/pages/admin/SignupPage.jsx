import { Loader, Lock, Mail, User, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import PasswordStrengthMeter from "../../components/PasswordStrengthMeter";
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import AddressAutocomplete from "../../components/Map/AddressAutoComplete"; // ✅ ADD
import AddressPickerMap from "../../components/Map/AddressPickerMap"; // ✅ ADD

const SignUpPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [locationCoords, setLocationCoords] = useState(null); // ✅ ADD coordinates
  const navigate = useNavigate();

  const { signup, error, isLoading } = useAuthStore();

  // ✅ ADD: Handle address selection from autocomplete
  const handleAddressSelect = (addressData) => {
    setAddress(addressData.address);
    setLocationCoords({
      lat: addressData.lat,
      lng: addressData.lng,
    });
  };

  // Validate full name - only letters and spaces
  const handleNameChange = (e) => {
    const value = e.target.value;
    // Only allow letters and spaces
    if (/^[a-zA-Z\s]*$/.test(value)) {
      setName(value);
    }
  };

  // Validate phone number - format 09XXXXXXXXX (11 digits starting with 0)
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      // Limit to 11 digits
      if (value.length <= 11) {
        setPhone(value);
      }
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    // Check if all fields are filled
    if (!email || !password || !name || !phone || !address) {
      toast.error("All fields are required");
      return;
    }

    // Validate full name
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      toast.error("Full name should only contain letters and spaces");
      return;
    }

    // Validate phone number format
    if (phone.length !== 11) {
      toast.error("Phone number must be exactly 11 digits");
      return;
    }

    if (!phone.startsWith("09")) {
      toast.error("Phone number must start with 09 (e.g., 09123456789)");
      return;
    }

    // ✅ ADD: Validate location coordinates
    if (!locationCoords || !locationCoords.lat || !locationCoords.lng) {
      toast.error("Please select your cafe address from the suggestions");
      return;
    }

    try {
      await signup(email, password, name, phone, address, locationCoords); // ✅ Pass coordinates
      toast.success("Account created successfully!");
      navigate("/login");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to create account");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700 overflow-y-auto p-4"
    >
      <div className="max-w-4xl w-full bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg overflow-hidden border border-gray-200 my-8">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-center text-white mb-2">
            Create Admin Account
          </h2>
          <p className="text-center text-white/80 mb-6">
            Register your cafe location
          </p>
          <div className="h-1 w-20 bg-blue-500 mx-auto mb-8"></div>

          <form onSubmit={handleSignUp}>
            {/* ✅ UPDATED: Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Form Fields */}
              <div className="space-y-4">
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

                {/* ✅ ADD: Address Autocomplete */}
                <div className="relative z-50">
                  <AddressAutocomplete
                    onAddressSelect={handleAddressSelect}
                    placeholder="Type your cafe address..."
                  />
                </div>

                {error && (
                  <p className="text-red-500 font-semibold">{error}</p>
                )}
                <PasswordStrengthMeter password={password} />
              </div>

              {/* Right Column - Map Preview */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-white mb-2">
                  📍 Cafe Location Preview
                </label>
                <AddressPickerMap
                  coordinates={locationCoords}
                  selectedAddress={address}
                />
                <p className="text-xs text-white/80">
                  Pin shows your cafe location for delivery routing
                </p>
              </div>
            </div>

            <button
              className="mt-6 w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md 
                            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                            transition duration-200"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader className="animate-spin mx-auto" size={24} />
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
        </div>
        <div className="px-8 py-4 bg-gray-50 bg-opacity-20 flex justify-center">
          <p className="text-sm text-white">
            Already have an account?{" "}
            <Link
              to={"/login"}
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

export default SignUpPage;
