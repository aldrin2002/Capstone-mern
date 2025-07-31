import { useState, useEffect } from "react";
import { Loader, Search, X, ChevronLeft, ChevronRight, Download, Heart, Share2, ZoomIn, ZoomOut } from "lucide-react";
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!selectedImage) return;
      
      switch(e.key) {
        case 'Escape':
          closeModal();
          break;
        case 'ArrowLeft':
          navigateImage('prev');
          break;
        case 'ArrowRight':
          navigateImage('next');
          break;
        default:
          break;
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage, selectedImageIndex]);

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

  // Open modal with specific image
  const openModal = (image, index) => {
    setSelectedImage(image);
    setSelectedImageIndex(index);
    setIsZoomed(false);
    setImageLoading(true);
  };

  // Close modal
  const closeModal = () => {
    setSelectedImage(null);
    setSelectedImageIndex(0);
    setIsZoomed(false);
    setImageLoading(false);
  };

  // Navigate between images
  const navigateImage = (direction) => {
    if (direction === 'next') {
      const nextIndex = (selectedImageIndex + 1) % filteredGallery.length;
      setSelectedImageIndex(nextIndex);
      setSelectedImage(filteredGallery[nextIndex]);
    } else {
      const prevIndex = selectedImageIndex === 0 ? filteredGallery.length - 1 : selectedImageIndex - 1;
      setSelectedImageIndex(prevIndex);
      setSelectedImage(filteredGallery[prevIndex]);
    }
    setIsZoomed(false);
    setImageLoading(true);
  };

  // Download image
  const downloadImage = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${selectedImage.image}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedImage.title}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  // Share image
  const shareImage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedImage.title,
          text: selectedImage.description || 'Check out this image from CafeX Gallery',
          url: window.location.href
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

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
              {filteredGallery.map((image, index) => (
                <div
                  key={image._id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer group"
                  onClick={() => openModal(image, index)}
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={`${API_BASE_URL}${image.image}`}
                      alt={image.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {image.featured && (
                      <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold bg-yellow-500 text-white rounded-lg shadow-md">
                        Featured
                      </span>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                      <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={32} />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1 truncate">{image.title}</h3>
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

      {/* Enhanced Responsive Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
          {/* Modal Content - Responsive Container */}
          <div className="relative w-full h-full flex flex-col max-w-7xl">
            
            {/* Header - Mobile Optimized */}
            <div className="flex justify-between items-center p-2 sm:p-3 md:p-4 bg-gradient-to-r from-black/80 to-black/60 backdrop-blur-md">
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-1 min-w-0">
                <h2 className="text-white text-xs sm:text-sm md:text-lg lg:text-xl font-semibold truncate max-w-[120px] sm:max-w-[150px] md:max-w-xs lg:max-w-md">
                  {selectedImage.title}
                </h2>
                {selectedImage.featured && (
                  <span className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 text-xs font-semibold bg-yellow-500 text-black rounded whitespace-nowrap">
                    Featured
                  </span>
                )}
              </div>
              
              {/* Action buttons - Mobile Responsive */}
              <div className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-2 shrink-0">
                {/* Share button */}
                <button
                  onClick={shareImage}
                  className="p-1.5 sm:p-2 md:p-2.5 text-white hover:text-blue-400 hover:bg-white/20 rounded-full transition-all duration-200 active:scale-95 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
                  title="Share"
                >
                  <Share2 size={isMobile ? 16 : 18} />
                </button>
                
                {/* Download button */}
                <button
                  onClick={downloadImage}
                  className="p-1.5 sm:p-2 md:p-2.5 text-white hover:text-green-400 hover:bg-white/20 rounded-full transition-all duration-200 active:scale-95 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
                  title="Download"
                >
                  <Download size={isMobile ? 16 : 18} />
                </button>
                
                {/* Zoom button - Hidden on mobile */}
                {!isMobile && (
                  <button
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="p-2 md:p-2.5 text-white hover:text-purple-400 hover:bg-white/20 rounded-full transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
                    title={isZoomed ? "Zoom Out" : "Zoom In"}
                  >
                    {isZoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
                  </button>
                )}
                
                {/* Close button - Enhanced visibility */}
                <button
                  onClick={closeModal}
                  className="p-1.5 sm:p-2 md:p-2.5 text-white hover:text-red-400 hover:bg-red-500/20 bg-red-500/10 rounded-full transition-all duration-200 active:scale-95 min-w-[38px] min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] flex items-center justify-center border border-red-500/30"
                  title="Close"
                >
                  <X size={isMobile ? 18 : 20} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Image Container - Responsive */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden px-2 sm:px-4">
              {/* Navigation arrows - Mobile Optimized */}
              {filteredGallery.length > 1 && (
                <>
                  <button
                    onClick={() => navigateImage('prev')}
                    className="absolute left-2 sm:left-4 z-10 p-2 sm:p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                    title="Previous Image"
                  >
                    <ChevronLeft size={isMobile ? 20 : 24} />
                  </button>
                  <button
                    onClick={() => navigateImage('next')}
                    className="absolute right-2 sm:right-4 z-10 p-2 sm:p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                    title="Next Image"
                  >
                    <ChevronRight size={isMobile ? 20 : 24} />
                  </button>
                </>
              )}

              {/* Image - Responsive Sizing */}
              <div className={`relative transition-all duration-300 ${
                !isMobile && isZoomed ? 'transform scale-150 cursor-move' : 'cursor-zoom-in'
              }`}>
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                    <Loader className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-spin" />
                  </div>
                )}
                <img
                  src={`${API_BASE_URL}${selectedImage.image}`}
                  alt={selectedImage.title}
                  className={`
                    w-full h-auto max-w-full
                    max-h-[50vh] sm:max-h-[60vh] md:max-h-[70vh] lg:max-h-[75vh]
                    object-contain rounded-lg shadow-2xl
                    transition-opacity duration-300
                    ${imageLoading ? 'opacity-0' : 'opacity-100'}
                  `}
                  onLoad={() => setImageLoading(false)}
                  onClick={() => !isMobile && setIsZoomed(!isZoomed)}
                />
              </div>
            </div>

            {/* Footer - Mobile Optimized */}
            <div className="p-3 sm:p-4 bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                {/* Description */}
                <div className="flex-1 sm:mr-4">
                  {selectedImage.description && (
                    <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-3 sm:line-clamp-2">
                      {selectedImage.description}
                    </p>
                  )}
                </div>
                
                {/* Counter and Indicators */}
                <div className="flex items-center justify-between w-full sm:w-auto sm:text-right">
                  <p className="text-gray-400 text-xs sm:text-sm">
                    {selectedImageIndex + 1} of {filteredGallery.length}
                  </p>
                  
                  {/* Progress Indicators - Responsive */}
                  <div className="flex space-x-1 ml-4">
                    {filteredGallery.slice(
                      Math.max(0, selectedImageIndex - (isMobile ? 1 : 2)), 
                      selectedImageIndex + (isMobile ? 2 : 3)
                    ).map((_, index) => {
                      const actualIndex = Math.max(0, selectedImageIndex - (isMobile ? 1 : 2)) + index;
                      return (
                        <div
                          key={actualIndex}
                          className={`
                            w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-200
                            ${actualIndex === selectedImageIndex ? 'bg-white' : 'bg-gray-600'}
                          `}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Mobile Swipe Hint */}
              {isMobile && filteredGallery.length > 1 && (
                <div className="mt-2 text-center">
                  <p className="text-gray-500 text-xs">
                    Use arrow buttons to navigate • Tap outside to close
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Click outside to close - Full coverage */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={closeModal}
          />
        </div>
      )}

      {/* Add responsive styles */}
      <style jsx>{`
        @media (max-width: 640px) {
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }
        
        @media (min-width: 641px) {
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerGallery;