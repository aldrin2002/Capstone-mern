import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Store, Package, Clock, Ruler } from 'lucide-react';
import axios from 'axios';

// ✅ Get Mapbox token from environment
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const cafeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const RouteMap = ({ cafeCoords, customerCoords, cafeAddress, customerAddress }) => {
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // ✅ FIXED: Fetch route from Mapbox Directions API without credentials
  useEffect(() => {
    if (!cafeCoords || !customerCoords || !MAPBOX_TOKEN) {
      console.warn('Missing coordinates or Mapbox token');
      return;
    }

    const fetchRoute = async () => {
      setIsLoadingRoute(true);
      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${cafeCoords.lng},${cafeCoords.lat};${customerCoords.lng},${customerCoords.lat}`;
        
        console.log('🗺️ Fetching route from Mapbox:', url);
        
        // ✅ CRITICAL FIX: Disable withCredentials for Mapbox API
        const response = await axios.get(url, {
          params: {
            geometries: 'geojson',
            overview: 'full',
            steps: true,
            access_token: MAPBOX_TOKEN
          },
          // ✅ THIS IS THE FIX - Explicitly disable credentials
          withCredentials: false
        });

        if (response.data.routes && response.data.routes.length > 0) {
          const route = response.data.routes[0];
          
          console.log('✅ Route fetched successfully:', {
            distance: route.distance,
            duration: route.duration
          });
          
          // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
          const leafletCoords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRouteGeometry(leafletCoords);
          
          // Set route info
          setRouteInfo({
            distance: (route.distance / 1000).toFixed(2),
            duration: Math.round(route.duration / 60)
          });
        }
      } catch (error) {
        console.error('❌ Error fetching route from Mapbox:', error);
        if (error.response) {
          console.error('Response error:', error.response.data);
        }
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [cafeCoords, customerCoords]);

  if (!cafeCoords || !customerCoords) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Location data not available</p>
        </div>
      </div>
    );
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-96 bg-red-100 rounded-lg flex items-center justify-center border-2 border-red-300">
        <div className="text-center p-6">
          <Package className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-bold">Mapbox Token Missing</p>
          <p className="text-red-600 text-sm mt-2">Please add VITE_MAPBOX_TOKEN to your .env file</p>
        </div>
      </div>
    );
  }

  const center = [
    (cafeCoords.lat + customerCoords.lat) / 2,
    (cafeCoords.lng + customerCoords.lng) / 2
  ];

  return (
    <div className="space-y-4">
      {/* Route Info Cards */}
      {isLoadingRoute ? (
        <div className="bg-primary-100 border-2 border-primary-200 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="text-primary-700 font-medium">Calculating route...</span>
          </div>
        </div>
      ) : routeInfo ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary-100 border-2 border-primary-200 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <Ruler className="h-5 w-5 text-primary-700 mr-2" />
              <h4 className="font-bold text-primary-800">Distance</h4>
            </div>
            <p className="text-2xl font-bold text-brand">{routeInfo.distance} km</p>
          </div>
          
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <Clock className="h-5 w-5 text-green-600 mr-2" />
              <h4 className="font-bold text-green-800">Est. Time</h4>
            </div>
            <p className="text-2xl font-bold text-green-600">{routeInfo.duration} min</p>
          </div>
        </div>
      ) : null}

      {/* Map */}
      <div className="relative rounded-lg overflow-hidden shadow-lg border-2 border-gray-200">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '400px', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
            url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
          />

          {/* Cafe Marker */}
          <Marker position={[cafeCoords.lat, cafeCoords.lng]} icon={cafeIcon}>
            <Popup>
              <div className="text-center">
                <Store className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <strong className="block text-red-600">Cafe Location</strong>
                <p className="text-sm mt-1">{cafeAddress}</p>
              </div>
            </Popup>
          </Marker>

          {/* Customer Marker */}
          <Marker position={[customerCoords.lat, customerCoords.lng]} icon={customerIcon}>
            <Popup>
              <div className="text-center">
                <Navigation className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <strong className="block text-green-600">Delivery Location</strong>
                <p className="text-sm mt-1">{customerAddress}</p>
              </div>
            </Popup>
          </Marker>

          {/* Route Polyline */}
          {routeGeometry && (
            <Polyline 
              positions={routeGeometry} 
              color="#F13E93" 
              weight={5} 
              opacity={0.7}
            />
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center space-x-6">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-700">Cafe</span>
        </div>
        <div className="flex items-center">
          <div className="w-1 h-8 bg-brand mr-2"></div>
          <span className="text-sm text-gray-700">Route</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-700">Customer</span>
        </div>
      </div>

      {/* Mapbox Attribution */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Powered by <a href="https://www.mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Mapbox</a>
        </p>
      </div>
    </div>
  );
};

export default RouteMap;