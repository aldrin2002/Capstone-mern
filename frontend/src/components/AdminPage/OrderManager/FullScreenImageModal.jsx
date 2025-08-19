import React from "react";
import { X } from "lucide-react";

const FullScreenImageModal = ({ fullScreenImage, setFullScreenImage }) => {
  if (!fullScreenImage) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={() => setFullScreenImage(null)}
    >
      <div 
        className="relative max-w-6xl max-h-[95vh] overflow-hidden flex flex-col bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Proof of Payment</h3>
            <button 
              onClick={() => setFullScreenImage(null)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200"
              aria-label="Close full screen image"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-gray-50">
          <img 
            src={fullScreenImage}
            alt="Proof of Payment" 
            className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
          />
        </div>
        
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white text-center rounded-b-2xl">
          <a 
            href={fullScreenImage} 
            download="proof-of-payment.jpg"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 inline-flex items-center space-x-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download Image</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default FullScreenImageModal;