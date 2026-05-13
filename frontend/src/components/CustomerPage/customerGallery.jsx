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
      const imageUrl = selectedImage.image.startsWith('http') 
        ? selectedImage.image 
        : `${API_BASE_URL}${selectedImage.image}`;
        
      const response = await fetch(imageUrl);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-100 to-primary-200">
      {/* Sidebar */}
      <CustomerSideNav />

      {/* Main Content */}
      <main className={`${isMobile ? 'pb-20' : 'ml-64'}`}>
        {/* Header Section */}
        <div
          className="relative bg-cover bg-center h-64"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 bg-opacity-90 flex items-center justify-center">
            <div className="text-center px-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                CAFE GALLERY
              </h1>
              <p className="text-primary-200 text-sm md:text-base">
                Discover the beautiful moments and ambiance of our cafe
              </p>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="container mx-auto px-4 py-6">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto mb-8">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search gallery..."
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 shadow-sm hover:shadow-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Gallery Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Loader className="h-12 w-12 text-brand animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading gallery images...</p>
              </div>
            </div>
          ) : filteredGallery.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No images found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 
                    `No images match "${searchTerm}". Try a different search term.` :
                    "No gallery images available at the moment."
                  }
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Gallery Grid - Enhanced responsive layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-8">
                {filteredGallery.map((image, index) => (
                  <div
                    key={image._id}
                    className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer group border border-gray-100"
                    onClick={() => openModal(image, index)}
                  >
                    <div className="relative h-48 md:h-56 overflow-hidden">
                      <img
                        src={image.image.startsWith('http') ? image.image : `${API_BASE_URL}${image.image}`}
                        alt={image.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      
                      {/* Featured badge */}
                      {image.featured && (
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full shadow-lg">
                            ★ Featured
                          </span>
                        </div>
                      )}
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                            <ZoomIn className="text-gray-800" size={24} />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 truncate text-sm md:text-base">
                        {image.title}
                      </h3>
                      {image.description && (
                        <p className="text-xs md:text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {image.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Enhanced Responsive Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
          {/* Modal Content - Responsive Container */}
          <div className="relative w-full h-full flex flex-col max-w-7xl">
            
            {/* Header - Mobile Optimized */}
            <div className="flex justify-between items-center p-3 md:p-4 bg-gradient-to-r from-black/80 to-black/60 backdrop-blur-md border-b border-white/10">
              <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
                <h2 className="text-white text-sm md:text-lg lg:text-xl font-semibold truncate max-w-[150px] md:max-w-md">
                  {selectedImage.title}
                </h2>
                {selectedImage.featured && (
                  <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full whitespace-nowrap">
                    ★ Featured
                  </span>
                )}
              </div>
              
              {/* Action buttons - Mobile Responsive */}
              <div className="flex items-center space-x-1 md:space-x-2 shrink-0">
                {/* Share button */}
                <button
                  onClick={shareImage}
                  className="p-2 md:p-2.5 text-white hover:text-primary-300 hover:bg-white/20 rounded-full transition-all duration-200 active:scale-95"
                  title="Share"
                >
                  <Share2 size={isMobile ? 16 : 18} />
                </button>
                
                {/* Download button */}
                <button
                  onClick={downloadImage}
                  className="p-2 md:p-2.5 text-white hover:text-green-400 hover:bg-white/20 rounded-full transition-all duration-200 active:scale-95"
                  title="Download"
                >
                  <Download size={isMobile ? 16 : 18} />
                </button>
                
                {/* Zoom button - Hidden on mobile */}
                {!isMobile && (
                  <button
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="p-2.5 text-white hover:text-purple-400 hover:bg-white/20 rounded-full transition-all duration-200"
                    title={isZoomed ? "Zoom Out" : "Zoom In"}
                  >
                    {isZoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
                  </button>
                )}
                
                {/* Close button - Enhanced visibility */}
                <button
                  onClick={closeModal}
                  className="p-2 md:p-2.5 text-white hover:text-red-400 hover:bg-red-500/20 bg-red-500/10 rounded-full transition-all duration-200 active:scale-95 border border-red-500/30"
                  title="Close"
                >
                  <X size={isMobile ? 18 : 20} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Image Container - Responsive */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden px-2 md:px-4">
              {/* Navigation arrows - Mobile Optimized */}
              {filteredGallery.length > 1 && (
                <>
                  <button
                    onClick={() => navigateImage('prev')}
                    className="absolute left-2 md:left-4 z-10 p-2 md:p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                    title="Previous Image"
                  >
                    <ChevronLeft size={isMobile ? 20 : 24} />
                  </button>
                  <button
                    onClick={() => navigateImage('next')}
                    className="absolute right-2 md:right-4 z-10 p-2 md:p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
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
                    <Loader className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
                <img
                  src={selectedImage.image.startsWith('http') ? selectedImage.image : `${API_BASE_URL}${selectedImage.image}`}
                  alt={selectedImage.title}
                  className={`
                    w-full h-auto max-w-full
                    max-h-[60vh] md:max-h-[70vh] lg:max-h-[75vh]
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
            <div className="p-3 md:p-4 bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-md border-t border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
                {/* Description */}
                <div className="flex-1 md:mr-4">
                  {selectedImage.description && (
                    <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-3 md:line-clamp-2">
                      {selectedImage.description}
                    </p>
                  )}
                </div>
                
                {/* Counter and Indicators */}
                <div className="flex items-center justify-between w-full md:w-auto">
                  <p className="text-gray-400 text-sm">
                    {selectedImageIndex + 1} of {filteredGallery.length}
                  </p>
                  
                  {/* Progress Indicators */}
                  <div className="flex space-x-1 ml-4">
                    {filteredGallery.slice(
                      Math.max(0, selectedImageIndex - 2), 
                      selectedImageIndex + 3
                    ).map((_, index) => {
                      const actualIndex = Math.max(0, selectedImageIndex - 2) + index;
                      return (
                        <div
                          key={actualIndex}
                          className={`
                            w-2 h-2 rounded-full transition-all duration-200
                            ${actualIndex === selectedImageIndex ? 'bg-white' : 'bg-gray-600'}
                          `}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Mobile Navigation Hint */}
              {isMobile && filteredGallery.length > 1 && (
                <div className="mt-3 text-center">
                  <p className="text-gray-500 text-xs">
                    Use arrow buttons to navigate • Tap outside to close
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Click outside to close */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={closeModal}
          />
        </div>
      )}

      {/* Custom styles for line clamping */}
      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default CustomerGallery;