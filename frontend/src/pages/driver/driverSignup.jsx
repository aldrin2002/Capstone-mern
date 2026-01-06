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
import axios from "axios";

const DriverSignUpPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [locationCoords, setLocationCoords] = useState(null);

  const navigate = useNavigate();
  const { driverSignup, isLoading, error } = useAuthStore();
  const [showVerify, setShowVerify] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState("");
  const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/auth" : "/api/auth";

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (/^[a-zA-Z\s]*$/.test(value)) setName(value);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 11) setPhone(value);
  };

  const handleAddressSelect = (addressData) => {
    if (addressData) {
      setAddress(addressData.address);
      setLocationCoords({ lat: addressData.lat, lng: addressData.lng });
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
    if (phone.length !== 11 || !phone.startsWith("09")) {
      toast.error("Phone must be 11 digits and start with 09 (e.g., 09123456789)");
      return;
    }
    if (!locationCoords?.lat || !locationCoords?.lng) {
      toast.error("Please select your address from the suggestions");
      return;
    }

    try {
      await driverSignup(email, password, name, phone, address, locationCoords);
      setPendingEmail(email);
      setShowVerify(true);
      toast.success("Verification code sent. Check your email.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create account");
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.error("Enter the 6-digit code");
      return;
    }
    try {
      await axios.post(`${API_URL}/verify-email`, { email: pendingEmail, code });
      toast.success("Email verified! You may now login.");
      setShowVerify(false);
      setCode("");
      navigate("/driverLogin");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    }
  };

  const handleResend = async () => {
    try {
      await axios.post(`${API_URL}/resend-code`, { email: pendingEmail });
      toast.success("New code sent");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend code");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700 overflow-y-auto p-4"
      >
        <div className="max-w-4xl w-full bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg overflow-hidden border border-gray-200 my-8">
          <div className="p-8">
            <h2 className="text-3xl font-bold text-center text-white mb-2">
              Create Driver Account
            </h2>
            <p className="text-center text-white/80 mb-6">
              Register your contact and delivery location
            </p>
            <div className="h-1 w-20 bg-blue-500 mx-auto mb-8"></div>

            <form onSubmit={handleSignUp}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <Input icon={User} type="text" placeholder="Full Name (letters only)" value={name} onChange={handleNameChange} />
                  <Input icon={Mail} type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Input icon={Lock} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <Input icon={Phone} type="text" placeholder="Phone Number (09XXXXXXXXX)" value={phone} onChange={handlePhoneChange} maxLength={11} />

                  <div className="relative z-50">
                    <AddressAutocomplete
                      onAddressSelect={handleAddressSelect}
                      placeholder="Type your address (e.g., 'Makati City, Philippines')"
                    />
                  </div>

                  {error && <p className="text-red-500 font-semibold">{error}</p>}
                  <PasswordStrengthMeter password={password} />
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-white mb-2">📍 Location Preview</label>
                  <AddressPickerMap coordinates={locationCoords} selectedAddress={address} />
                  <p className="text-xs text-white/80">Pin shows your location for delivery routing</p>
                </div>
              </div>

              <button
                className="mt-6 w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? <Loader className="animate-spin mx-auto" size={24} /> : "Sign Up"}
              </button>

              {/* Terms & Privacy */}
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

          <div className="px-8 py-4 bg-gray-50 bg-opacity-20 flex justify-center">
            <p className="text-sm text-white">
              Already have an account?{" "}
              <Link to={"/driverLogin"} className="text-blue-300 font-medium hover:underline">
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
            <p className="text-sm text-gray-600">
              Enter the 6-digit code sent to <span className="font-medium">{pendingEmail}</span>
            </p>
            <input
              value={code}
              onChange={(e)=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
              maxLength={6}
              placeholder="123456"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center font-mono"
            />
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={handleResend} className="text-blue-600 hover:underline">Resend code</button>
              <button type="button" onClick={()=>{setShowVerify(false); setCode("");}} className="text-gray-500 hover:underline">Cancel</button>
            </div>
            <button
              onClick={handleVerify}
              disabled={code.length !== 6}
              className="w-full py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-40"
            >
              Verify
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DriverSignUpPage;