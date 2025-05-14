import { useState, useEffect } from "react";
import { Loader, Search } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import CustomerSideNav, { MOBILE_NAV_HEIGHT } from "../../pages/customer/customerSideNav";

// API URLs
const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/gallery" : "/api/gallery";
const API_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";

const CustomerGallery = () => {
  const [gallery, setGallery] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch gallery images
  const fetchGallery = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL);
      setGallery(response.data);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      toast.error("Failed to load gallery images");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchGallery();
  }, []);

  // Filter gallery based on search term
  const filteredGallery = gallery.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <CustomerSideNav />

      {/* Main Content - Add padding bottom for mobile */}
      <main 
        className="flex-1 bg-white"
        style={isMobile ? { paddingBottom: `${MOBILE_NAV_HEIGHT + 16}px` } : {}}
      >
        {/* Header Section */}
        <div
          className="relative bg-cover bg-center h-64"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-blue-900 bg-opacity-80 flex items-center justify-center">
            <h1 className="text-4xl font-bold text-white">CAFE GALLERY</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="container mx-auto px-4 py-6">
          <div className="relative max-w-md mx-auto mb-8">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search gallery..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Gallery Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
          ) : filteredGallery.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No gallery images found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-16 md:pb-0">
              {filteredGallery.map((image) => (
                <div
                  key={image._id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform hover:scale-105 cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="relative h-56">
                    <img
                      src={`${API_BASE_URL}${image.image}`}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    {image.featured && (
                      <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold bg-yellow-500 text-white rounded-lg">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1">{image.title}</h3>
                    {image.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{image.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white p-4 rounded-lg max-w-3xl w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedImage(null)}
            >
              &times;
            </button>
            <div className="mt-4 mb-4">
              <img
                src={`${API_BASE_URL}${selectedImage.image}`}
                alt={selectedImage.title}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold">{selectedImage.title}</h2>
            {selectedImage.description && (
              <p className="text-gray-600 mt-2">{selectedImage.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerGallery;