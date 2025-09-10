import { useState, useEffect } from "react";
import CustomerSideNav, { MOBILE_NAV_HEIGHT } from "../../pages/customer/customerSideNav";
import developerImage from "../../assets/FECHALIN_ALDRIN_3A.png"; // Developer image
import beneficiaryImage from "../../assets/MS_Christianne_PFP.jpg"; // Beneficiary image
import adviserImage from "../../assets/SIR_OWEN_PFP.jpg"; // Adviser image
import { Code, Crown, GraduationCap, Coffee, Users, Target, Heart, Award } from "lucide-react";

const CustomerAboutUs = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/5 to-blue-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Sidebar */}
      <CustomerSideNav />

      {/* Main Content - Adjusted for fixed sidebar */}
      <main className={`relative z-10 ${isMobile ? 'pb-20' : 'ml-64'}`}>
        {/* Enhanced Header Section */}
        <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          {/* Floating decoration elements */}
          <div className="absolute top-10 right-10 w-20 h-20 border border-white/20 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-16 h-16 border border-white/10 rounded-full animate-pulse delay-1000"></div>
          
          <div className="relative h-80 flex items-center justify-center">
            <div className="text-center px-4">
              <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-6">
                <Users className="h-4 w-4 mr-2" />
                Meet Our Amazing Team
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                ABOUT US
              </h1>
              <p className="text-lg md:text-xl text-blue-200 max-w-2xl mx-auto">
                Discover the passionate individuals behind CafeX's innovative management system
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Content Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/50">
            <div className="p-6 md:p-8 lg:p-12">
              <div className="space-y-12">
                {/* Enhanced Team Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 md:p-8 lg:p-10 rounded-3xl border border-blue-100 relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-indigo-200/20 to-transparent rounded-full -ml-12 -mb-12"></div>
                  
                  <div className="relative">
                    <div className="text-center mb-12">
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-900 to-indigo-800 bg-clip-text text-transparent mb-4">
                        Meet the Person Behind All of These
                      </h3>
                      <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto"></div>
                    </div>
                    
                    {/* Enhanced Developer Section */}
                    <div className="flex flex-col lg:flex-row items-center mb-12 group">
                      <div className="relative mb-6 lg:mb-0 lg:mr-8 flex-shrink-0">
                        {/* Animated border */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full p-1 animate-spin-slow">
                          <div className="w-48 h-48 md:w-56 md:h-56 bg-white rounded-full"></div>
                        </div>
                        
                        {/* Profile image */}
                        <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white shadow-2xl group-hover:scale-105 transition-all duration-500">
                          <img 
                            src={developerImage}
                            alt="Developer" 
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay icon */}
                          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                              <Code className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 text-center lg:text-left">
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                          <h4 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-800 to-indigo-700 bg-clip-text text-transparent mb-2">
                            Aldrin G. Fechalin
                          </h4>
                          <div className="flex items-center justify-center lg:justify-start mb-4">
                            <Code className="h-5 w-5 text-blue-600 mr-2" />
                            <p className="text-blue-600 font-semibold">Lead Developer</p>
                          </div>
                          <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                            As the sole programmer of this project, I've dedicated countless hours to designing and implementing 
                            this comprehensive cafe management system. My passion for both technology and coffee culture 
                            inspired me to create a solution that enhances the cafe experience for both businesses and their customers.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Beneficiary Section */}
                    <div className="flex flex-col lg:flex-row-reverse items-center mb-12 group">
                      <div className="relative mb-6 lg:mb-0 lg:ml-8 flex-shrink-0">
                        {/* Animated border */}
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-blue-500 to-green-500 rounded-full p-1 animate-spin-slow">
                          <div className="w-48 h-48 md:w-56 md:h-56 bg-white rounded-full"></div>
                        </div>
                        
                        {/* Profile image */}
                        <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white shadow-2xl group-hover:scale-105 transition-all duration-500">
                          <img 
                            src={beneficiaryImage}
                            alt="Beneficiary" 
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay icon */}
                          <div className="absolute inset-0 bg-gradient-to-t from-green-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                              <Crown className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 text-center lg:text-right">
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                          <h4 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-800 to-blue-700 bg-clip-text text-transparent mb-2">
                            Ms. Christianne E. Tebelin
                          </h4>
                          <div className="flex items-center justify-center lg:justify-end mb-4">
                            <Crown className="h-5 w-5 text-green-600 mr-2" />
                            <p className="text-green-600 font-semibold">Cafe Owner & Project Beneficiary</p>
                          </div>
                          <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                            This project was developed to support local cafe businesses by providing an accessible, 
                            efficient management system. Ms. Christianne E. Tebelin's cafe serves as the primary testing ground 
                            for this system, and their valuable feedback has helped shape the features and functionality 
                            that make this platform truly effective for real-world use.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Project Adviser Section */}
                    <div className="flex flex-col lg:flex-row items-center group">
                      <div className="relative mb-6 lg:mb-0 lg:mr-8 flex-shrink-0">
                        {/* Animated border */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 rounded-full p-1 animate-spin-slow">
                          <div className="w-48 h-48 md:w-56 md:h-56 bg-white rounded-full"></div>
                        </div>
                        
                        {/* Profile image */}
                        <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white shadow-2xl group-hover:scale-105 transition-all duration-500">
                          <img 
                            src={adviserImage}
                            alt="Project Adviser" 
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay icon */}
                          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                              <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 text-center lg:text-left">
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                          <h4 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-800 to-blue-700 bg-clip-text text-transparent mb-2">
                            Mr. Owen Jasper Vargas
                          </h4>
                          <div className="flex items-center justify-center lg:justify-start mb-4">
                            <GraduationCap className="h-5 w-5 text-purple-600 mr-2" />
                            <p className="text-purple-600 font-semibold">Project Adviser</p>
                          </div>
                          <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                            Under the expert guidance of Mr. Owen Jasper Vargas, this project has evolved from a concept to a 
                            fully realized system. Their mentorship, technical expertise, and industry knowledge have 
                            been instrumental in ensuring that this cafe management solution not only meets academic 
                            standards but also delivers genuine value to businesses in the real world.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Project Overview Section */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 md:p-8 lg:p-10 rounded-3xl border border-indigo-100 relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-indigo-200/20 to-transparent rounded-full -ml-20 -mt-20"></div>
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-transparent rounded-full -mr-16 -mb-16"></div>
                  
                  <div className="relative">
                    <div className="flex items-center justify-center mb-6">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                        <Target className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-900 to-purple-800 bg-clip-text text-transparent mb-6 text-center">
                      Project Overview
                    </h3>
                    
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                      <p className="text-gray-700 leading-relaxed text-center text-base md:text-lg">
                        The Cafe Management System is a comprehensive solution developed as part of 
                        my final year project, aiming to digitize traditional cafe operations. 
                        The system includes features for inventory management, order processing, 
                        customer relationship management, and real-time analytics.
                      </p>
                    </div>
                    
                    {/* Feature highlights */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                      {[
                        {
                          icon: <Coffee className="h-6 w-6" />,
                          label: "Cafe Management",
                          color: "text-amber-600"
                        },
                        {
                          icon: <Users className="h-6 w-6" />,
                          label: "Customer Experience",
                          color: "text-blue-600"
                        },
                        {
                          icon: <Heart className="h-6 w-6" />,
                          label: "User Friendly",
                          color: "text-red-600"
                        },
                        {
                          icon: <Award className="h-6 w-6" />,
                          label: "Professional Grade",
                          color: "text-green-600"
                        }
                      ].map((feature, index) => (
                        <div key={index} className="text-center group">
                          <div className={`${feature.color} mb-2 flex justify-center group-hover:scale-110 transition-transform duration-300`}>
                            {feature.icon}
                          </div>
                          <p className="text-sm font-medium text-gray-700">{feature.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Custom styles for animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        
        .animate-slide-in {
          animation: slide-in 0.8s ease-out forwards;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .delay-300 {
          animation-delay: 300ms;
        }
        
        .delay-500 {
          animation-delay: 500ms;
        }
        
        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
};

export default CustomerAboutUs;