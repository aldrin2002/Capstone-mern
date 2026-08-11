import { Loader, Lock, Mail, User, Phone } from "lucide-react";
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
  const [showVerify, setShowVerify] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState("");
  const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/auth" : "/api/auth";

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
      await signup(email, password, name, phone, address, locationCoords);
      // Backend now sends verification code email; show modal instead of navigating
      setPendingEmail(email);
      setShowVerify(true);
      toast.success("Verification code sent. Check your email.");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to create account");
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.error("Enter the 6-digit code");
      return;
    }
    try {
      await fetch(`${API_URL}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code })
      }).then(r => r.json()).then(data => {
        if (!data.success) throw new Error(data.message);
      });
      toast.success("Email verified! You may now login.");
      setShowVerify(false);
      setCode("");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Verification failed");
    }
  };

  const handleResend = async () => {
    try {
      await fetch(`${API_URL}/resend-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail })
      }).then(r => r.json()).then(data => {
        if (!data.success) throw new Error(data.message);
      });
      toast.success("New code sent");
    } catch (err) {
      toast.error(err.message || "Failed to resend code");
    }
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-start sm:items-center justify-center bg-gradient-to-r from-brand to-primary-800 overflow-y-auto px-3 py-4 sm:p-4"
    >
      <div className="w-full max-w-4xl bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl sm:rounded-lg shadow-lg overflow-hidden border border-gray-200 my-2 sm:my-8">
        <div className="p-4 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-2">
            Create Admin Account
          </h2>
          <p className="text-center text-sm sm:text-base text-white/80 mb-5 sm:mb-6">
            Register your cafe location
          </p>
          <div className="h-1 w-16 sm:w-20 bg-brand mx-auto mb-6 sm:mb-8"></div>

          <form onSubmit={handleSignUp}>
            {/* ✅ UPDATED: Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column - Form Fields */}
              <div className="space-y-3 sm:space-y-4">
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
              <div className="space-y-3 sm:space-y-4">
                <label className="block text-sm font-medium text-white mb-1 sm:mb-2">
                  📍 Cafe Location Preview
                </label>
                <AddressPickerMap
                  coordinates={locationCoords}
                  selectedAddress={address}
                />
                <p className="text-xs sm:text-sm text-white/80">
                  Pin shows your cafe location for delivery routing
                </p>
              </div>
            </div>

            <button
              className="mt-5 sm:mt-6 w-full py-3 px-4 bg-brand text-white font-semibold rounded-md shadow-md 
                            hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2
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
            {/* Terms and Privacy */}
            <div className="text-center mt-3">
              <p className="text-xs text-white">
                By signing up, you agree to our{" "}
                <Link
                  to="/terms-conditions"
                  className="text-primary-200 hover:text-primary-100 underline font-medium transition-colors duration-200"
                >
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy-policy"
                  className="text-primary-200 hover:text-primary-100 underline font-medium transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </form>
        </div>
        <div className="px-4 sm:px-8 py-3 sm:py-4 bg-gray-50 bg-opacity-20 flex justify-center">
          <p className="text-xs sm:text-sm text-white text-center">
            Already have an account?{" "}
            <Link
              to={"/login"}
              className="text-primary-200 font-medium hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
    {showVerify && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Verify Email</h3>
          <p className="text-sm text-gray-600">Enter the 6-digit code sent to <span className="font-medium">{pendingEmail}</span></p>
          <input
            value={code}
            onChange={(e)=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
            maxLength={6}
            placeholder="123456"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand tracking-widest text-center font-mono"
          />
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={handleResend} className="text-brand hover:underline">Resend code</button>
            <button type="button" onClick={()=>{setShowVerify(false); setCode("");}} className="text-gray-500 hover:underline">Cancel</button>
          </div>
          <button
            onClick={handleVerify}
            disabled={code.length !== 6}
            className="w-full py-2 rounded-lg bg-brand text-white font-semibold disabled:opacity-40"
          >Verify</button>
        </div>
      </div>
    )}
    </>
  );
};

export default SignUpPage;
