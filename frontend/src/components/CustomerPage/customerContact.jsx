import { useState, useEffect } from "react";
import axios from "axios";
import CustomerSideNav, { MOBILE_NAV_HEIGHT } from "../../pages/customer/customerSideNav";
import { Mail, Phone, MapPin, Clock, MessageCircle, Sparkles } from "lucide-react";

const CustomerContact = () => {
  const [contactInfo, setContactInfo] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch contact information
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const apiUrl = import.meta.env.MODE === "development" 
          ? "http://localhost:5000/api/contact" 
          : "/api/contact";
        const response = await axios.get(apiUrl);
        setContactInfo(response.data);
      } catch (error) {
        console.error("Error fetching contact information:", error);
      }
    };

    fetchContactInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/15 to-purple-500/15 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-pink-400/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-gradient-to-br from-purple-400/8 to-blue-400/8 rounded-full blur-3xl animate-pulse-slow"></div>
        
        {/* Floating sparkles */}
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-twinkle"></div>
        <div className="absolute top-40 right-1/3 w-1 h-1 bg-purple-400 rounded-full opacity-40 animate-twinkle-delayed"></div>
        <div className="absolute bottom-32 left-1/3 w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-50 animate-twinkle"></div>
      </div>

      {/* Sidebar */}
      <CustomerSideNav />

      {/* Main Content - Adjusted for fixed sidebar */}
      <main className={`relative z-10 ${isMobile ? 'pb-20' : 'ml-64'}`}>
        {/* Enhanced Header Section */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <div 
              className="absolute inset-0 opacity-50" 
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            ></div>
          </div>
          
          {/* Enhanced floating decoration elements */}
          <div className="absolute top-8 right-8 w-20 h-20 border-2 border-white/20 rounded-full animate-spin-slow"></div>
          <div className="absolute top-16 right-24 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-12 left-12 w-16 h-16 border border-white/10 rounded-full animate-pulse-delayed"></div>
          <div className="absolute bottom-20 left-6 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce-gentle"></div>
          
          <div className="relative px-4 py-12 md:py-16">
            <div className="container mx-auto text-center">
              {/* Enhanced badge */}
              <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-lg rounded-full text-blue-200 text-sm font-medium mb-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300">
                <MessageCircle className="h-4 w-4 mr-2 animate-pulse" />
                <Sparkles className="h-3 w-3 mr-2 text-yellow-300" />
                Get in Touch
              </div>
              
              {/* Enhanced title with gradient animation */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent animate-gradient-x bg-300% leading-tight">
                CONTACT US
              </h1>
              
              <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed font-light">
                We're here to help and answer any questions you might have.
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Contact Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/60 relative">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-3xl"></div>
            
            <div className="relative p-8 md:p-12">
              {/* Enhanced Contact Information - Now full width */}
              <div className="max-w-4xl mx-auto">
                <div className="space-y-8">
                  <div className="space-y-3 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
                        Get in Touch
                      </h2>
                    </div>
                    <p className="text-gray-600 text-lg">
                      We're here to help and answer any questions you might have.
                    </p>
                  </div>
                  
                  {contactInfo ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Address */}
                      <div className="group p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl border border-blue-100/50 hover:shadow-lg transition-all duration-500 hover:scale-[1.02] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                        <div className="relative flex items-start">
                          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg mr-4 group-hover:scale-110 transition-transform duration-300">
                            <MapPin className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors duration-300">Address</h3>
                            <p className="text-gray-600 leading-relaxed">{contactInfo.address}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Opening Hours */}
                      <div className="group p-6 bg-gradient-to-r from-purple-50/80 to-pink-50/80 backdrop-blur-sm rounded-2xl border border-purple-100/50 hover:shadow-lg transition-all duration-500 hover:scale-[1.02] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                        <div className="relative flex items-start">
                          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg mr-4 group-hover:scale-110 transition-transform duration-300">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-purple-600 transition-colors duration-300">Opening Hours</h3>
                            <p className="text-gray-600 leading-relaxed">{contactInfo.hours}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Phone */}
                      <div className="group p-6 bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm rounded-2xl border border-green-100/50 hover:shadow-lg transition-all duration-500 hover:scale-[1.02] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                        <div className="relative flex items-start">
                          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg mr-4 group-hover:scale-110 transition-transform duration-300">
                            <Phone className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-green-600 transition-colors duration-300">Phone</h3>
                            <p className="text-gray-600 leading-relaxed font-mono">{contactInfo.phone}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Email */}
                      <div className="group p-6 bg-gradient-to-r from-orange-50/80 to-amber-50/80 backdrop-blur-sm rounded-2xl border border-orange-100/50 hover:shadow-lg transition-all duration-500 hover:scale-[1.02] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                        <div className="relative flex items-start">
                          <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg mr-4 group-hover:scale-110 transition-transform duration-300">
                            <Mail className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-orange-600 transition-colors duration-300">Email</h3>
                            <p className="text-gray-600 leading-relaxed font-mono">{contactInfo.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Enhanced loading animation */}
                      {[...Array(4)].map((_, index) => (
                        <div key={index} className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50 animate-pulse">
                          <div className="flex items-start">
                            <div className="w-12 h-12 bg-gray-300 rounded-xl mr-4"></div>
                            <div className="flex-1 space-y-3">
                              <div className="h-5 bg-gray-300 rounded w-1/3"></div>
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced custom animations and styles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(2deg);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(-1deg);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.2;
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        @keyframes twinkle-delayed {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }
        
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes pulse-delayed {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
        
        .animate-twinkle-delayed {
          animation: twinkle-delayed 4s ease-in-out infinite 1s;
        }
        
        .animate-gradient-x {
          animation: gradient-x 15s ease infinite;
          background-size: 300% 300%;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 3s ease-in-out infinite;
        }
        
        .animate-pulse-delayed {
          animation: pulse-delayed 2s ease-in-out infinite 0.5s;
        }
        
        .bg-300% {
          background-size: 300% 300%;
        }
      `}</style>
    </div>
  );
};

export default CustomerContact;