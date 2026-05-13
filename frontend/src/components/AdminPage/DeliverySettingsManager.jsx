import { useState, useEffect } from 'react';
import { Truck, Coins, MapPin, Save, Loader, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.MODE === "development" 
  ? "http://localhost:5000/api/delivery-settings" 
  : "/api/delivery-settings";

const DeliverySettingsManager = () => {
  const [settings, setSettings] = useState({
    baseRate: 30,
    perKmRate: 10,
    maxDeliveryDistance: 20
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL, { withCredentials: true });
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching delivery settings:", error);
      toast.error("Failed to load delivery settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSave = async () => {
    // Validation
    if (settings.baseRate < 0 || settings.perKmRate < 0) {
      toast.error("Rates cannot be negative");
      return;
    }

    if (settings.maxDeliveryDistance <= 0) {
      toast.error("Maximum delivery distance must be greater than 0");
      return;
    }

    setIsSaving(true);
    try {
      const response = await axios.put(API_URL, settings, { 
        withCredentials: true 
      });

      Swal.fire({
        title: "Settings Updated!",
        text: "Delivery fee settings have been updated successfully",
        icon: "success",
        confirmButtonColor: "#F13E93"
      });

      setSettings(response.data.settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update delivery settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate example fees
  const calculateExample = (distance) => {
    const fee = settings.baseRate + (distance * settings.perKmRate);
    return fee.toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin h-8 w-8 text-brand" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="p-3 bg-gradient-to-br from-brand to-primary-700 rounded-2xl mr-4 shadow-lg">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Fee Settings</h1>
            <p className="text-gray-600 mt-1">Configure dynamic delivery pricing based on distance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Coins className="h-6 w-6 mr-2 text-green-600" />
            Pricing Configuration
          </h2>

          <div className="space-y-6">
            {/* Base Rate */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Base Rate (₱)
              </label>
              <input
                type="number"
                name="baseRate"
                value={settings.baseRate}
                onChange={handleChange}
                min="0"
                step="5"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum delivery fee charged regardless of distance</p>
            </div>

            {/* Per KM Rate */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Per Kilometer Rate (₱)
              </label>
              <input
                type="number"
                name="perKmRate"
                value={settings.perKmRate}
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <p className="text-xs text-gray-500 mt-1">Additional charge per kilometer traveled</p>
            </div>

            {/* Max Delivery Distance */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Maximum Delivery Distance (km)
              </label>
              <input
                type="number"
                name="maxDeliveryDistance"
                value={settings.maxDeliveryDistance}
                onChange={handleChange}
                min="1"
                step="1"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum distance for delivery service</p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-brand to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview & Examples */}
        <div className="space-y-6">
          {/* Current Formula */}
          <div className="bg-gradient-to-br from-purple-50 to-primary-100 rounded-2xl p-6 border-2 border-purple-200">
            <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Pricing Formula
            </h3>
            <div className="bg-white rounded-xl p-4">
              <p className="text-sm text-gray-700 mb-2">Delivery Fee = Base Rate + (Distance × Per KM Rate)</p>
              <div className="bg-purple-100 rounded-lg p-3 font-mono text-sm">
                <p className="text-purple-900">
                  Fee = ₱{settings.baseRate} + (Distance × ₱{settings.perKmRate})
                </p>
              </div>
            </div>
          </div>

          {/* Example Calculations */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-brand" />
              Example Delivery Fees
            </h3>
            <div className="space-y-3">
              {[1, 3, 5, 10, 15].map(distance => (
                <div key={distance} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-primary-100 transition-colors">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-700">{distance} km</span>
                  </div>
                  <span className="text-sm font-bold text-brand">₱{calculateExample(distance)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
            <h3 className="text-lg font-bold text-green-900 mb-3">📊 How It Works</h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li>✅ Customers see calculated delivery fee at checkout</li>
              <li>✅ Fee is based on distance between cafe and delivery address</li>
              <li>✅ Maximum delivery range: {settings.maxDeliveryDistance} km</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliverySettingsManager;