import { useState, useEffect } from "react";
import CustomerSideNav, { MOBILE_NAV_HEIGHT } from "../../pages/customer/customerSideNav";
import developerImage from "../../assets/FECHALIN_ALDRIN_3A.png"; // Developer image
import beneficiaryImage from "../../assets/MS_Christianne_PFP.jpg"; // Beneficiary image
import adviserImage from "../../assets/SIR_OWEN_PFP.jpg"; // Adviser image

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
    <div className="flex min-h-screen bg-gray-100 relative">
      {/* Sidebar */}
      <CustomerSideNav />

      {/* Main Content */}
      <main 
        className="flex-1 bg-white"
        style={isMobile ? { paddingBottom: `${MOBILE_NAV_HEIGHT + 16}px` } : {}}
      >
        {/* Rest of content stays the same */}
        {/* Header Section */}
        <div
          className="relative bg-cover bg-center h-64"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-blue-900 bg-opacity-80 flex items-center justify-center">
            <h1 className="text-4xl font-bold text-white">ABOUT US</h1>
          </div>
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="space-y-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-2xl font-bold text-blue-900 mb-5 text-center">Meet the Person Behind All of These</h3>
                  
                  {/* Developer Section */}
                  <div className="flex flex-col md:flex-row items-center mb-8">
                    <div className="w-48 h-48 mb-4 md:mb-0 md:mr-6 flex-shrink-0">
                      <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-blue-500">
                        {/* Replace with your actual image */}
                        <img 
                          src={developerImage}
                          alt="Developer" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="text-xl font-semibold text-blue-800 mb-2">Aldrin G. Fechalin</h4>
                      <p className="text-blue-600 font-medium mb-2">Lead Developer</p>
                      <p className="text-gray-700">
                        As the sole programmer of this project, I've dedicated countless hours to designing and implementing 
                        this comprehensive cafe management system. My passion for both technology and coffee culture 
                        inspired me to create a solution that enhances the cafe experience for both businesses and their customers.
                      </p>
                    </div>
                  </div>
                  
                  {/* Beneficiary Section */}
                  <div className="flex flex-col md:flex-row items-center mb-8">
                    <div className="w-48 h-48 mb-4 md:mb-0 md:mr-6 flex-shrink-0">
                      <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-blue-500">
                        {/* Replace with beneficiary image */}
                        <img 
                          src={beneficiaryImage}
                          alt="Beneficiary" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="text-xl font-semibold text-blue-800 mb-2">Ms. Christianne E. Tebelin</h4>
                      <p className="text-blue-600 font-medium mb-2">Cafe Owner & Project Beneficiary</p>
                      <p className="text-gray-700">
                        This project was developed to support local cafe businesses by providing an accessible, 
                        efficient management system. Ms. Christianne E. Tebelin's cafe serves as the primary testing ground 
                        for this system, and their valuable feedback has helped shape the features and functionality 
                        that make this platform truly effective for real-world use.
                      </p>
                    </div>
                  </div>
                  
                  {/* Project Adviser Section */}
                  <div className="flex flex-col md:flex-row items-center">
                    <div className="w-48 h-48 mb-4 md:mb-0 md:mr-6 flex-shrink-0">
                      <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-blue-500">
                        {/* Replace with adviser image */}
                        <img 
                          src={adviserImage}
                          alt="Project Adviser" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="text-xl font-semibold text-blue-800 mb-2">Mr. Owen Jasper Vargas</h4>
                      <p className="text-blue-600 font-medium mb-2">Project Adviser</p>
                      <p className="text-gray-700">
                        Under the expert guidance of Mr. Owen Jasper Vargas, this project has evolved from a concept to a 
                        fully realized system. Their mentorship, technical expertise, and industry knowledge have 
                        been instrumental in ensuring that this cafe management solution not only meets academic 
                        standards but also delivers genuine value to businesses in the real world.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-blue-900 mb-3">Project Overview</h3>
                  <p className="text-gray-700">
                    The Cafe Management System is a comprehensive solution developed as part of 
                    my final year project, aiming to digitize traditional cafe operations. 
                    The system includes features for inventory management, order processing, 
                    customer relationship management, and real-time analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerAboutUs;
