import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader, Search, X } from 'lucide-react';
import axios from 'axios';

// ✅ Get Mapbox token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const AddressAutocomplete = ({ 
  onAddressSelect, 
  initialAddress = '',
  placeholder = "Search for your address..."
}) => {
  const [query, setQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const debounceTimer = useRef(null);
  const wrapperRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update query when initialAddress changes
  useEffect(() => {
    if (initialAddress) {
      setQuery(initialAddress);
    }
  }, [initialAddress]);

  // ✅ UPDATED: Search using Mapbox Geocoding API
  const searchAddresses = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    if (!MAPBOX_TOKEN) {
      console.error('❌ Mapbox token is missing!');
      return;
    }

    setIsLoading(true);
    
    try {
      // Mapbox Geocoding API
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json`;
      
      const response = await axios.get(url, {
        params: {
          access_token: MAPBOX_TOKEN,
          country: 'PH',
          limit: 5,
          types: 'address,place,locality',
        },
        // ✅ ADD THIS: Disable credentials for Mapbox API
        withCredentials: false
      });

      console.log('🔍 Mapbox Geocoding response:', response.data);

      const results = response.data.features.map(feature => ({
        display_name: feature.place_name,
        lat: feature.center[1], // Mapbox returns [lng, lat]
        lng: feature.center[0],
        address: feature.place_name
      }));

      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('❌ Error fetching addresses from Mapbox:', error);
      setSuggestions([]);
      
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search to avoid too many API calls
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      searchAddresses(value);
    }, 500); // Wait 500ms after user stops typing
  };

  const handleSelectAddress = (suggestion) => {
    setQuery(suggestion.display_name);
    setSelectedAddress(suggestion);
    setShowSuggestions(false);
    
    // Call parent callback
    if (onAddressSelect) {
      onAddressSelect({
        address: suggestion.display_name,
        lat: suggestion.lat,
        lng: suggestion.lng
      });
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedAddress(null);
    if (onAddressSelect) {
      onAddressSelect(null);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand transition-all"
          autoComplete="off"
        />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectAddress(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-primary-100 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-brand mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 font-medium line-clamp-2">
                    {suggestion.display_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Lat: {suggestion.lat.toFixed(4)}, Lng: {suggestion.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No token warning */}
      {!MAPBOX_TOKEN && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          ⚠️ Mapbox token is missing. Add VITE_MAPBOX_TOKEN to your .env file.
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;