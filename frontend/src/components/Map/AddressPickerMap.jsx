import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// ✅ Get Mapbox token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to update map center when coordinates change
function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

const AddressPickerMap = ({ coordinates, selectedAddress }) => {
  const defaultCenter = [14.5995, 120.9842]; // Manila default
  const [mapCenter, setMapCenter] = useState(
    coordinates ? [coordinates.lat, coordinates.lng] : defaultCenter
  );

  useEffect(() => {
    if (coordinates) {
      setMapCenter([coordinates.lat, coordinates.lng]);
    }
  }, [coordinates]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-52 sm:h-64 bg-red-50 border-2 border-red-300 rounded-lg flex items-center justify-center">
        <div className="text-center p-4">
          <MapPin className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-bold text-sm">Mapbox Token Missing</p>
          <p className="text-red-600 text-xs mt-1">Add VITE_MAPBOX_TOKEN to .env</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Map Container */}
      <div className="rounded-lg overflow-hidden border-2 border-gray-300 shadow-md">
        <MapContainer
          center={mapCenter}
          zoom={coordinates ? 15 : 11}
          style={{ height: 'clamp(200px, 36vh, 250px)', width: '100%' }}
          scrollWheelZoom={false}
          zoomControl={true}
        >
          {/* ✅ UPDATED: Use Mapbox tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
            url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
          />
          
          <MapUpdater center={mapCenter} zoom={coordinates ? 15 : 11} />
          
          {/* Show marker if coordinates are available */}
          {coordinates && (
            <Marker position={[coordinates.lat, coordinates.lng]} />
          )}
        </MapContainer>
      </div>

      {/* Info Box */}
      {coordinates && (
        <div className="mt-3 p-3 bg-primary-100 rounded-lg border border-primary-200">
          <div className="flex items-start space-x-2">
            <MapPin className="h-5 w-5 text-primary-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-primary-900 mb-1">
                Pinned Location:
              </p>
              <p className="text-xs text-primary-700">
                <strong>Coordinates:</strong> {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
              {selectedAddress && (
                <p className="text-xs text-primary-700 mt-1">
                  <strong>Address:</strong> {selectedAddress}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressPickerMap;