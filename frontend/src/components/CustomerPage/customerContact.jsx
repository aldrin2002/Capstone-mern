import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import CustomerSideNav, { MOBILE_NAV_HEIGHT } from "../../pages/customer/customerSideNav";
import { useAuthStore } from "../../store/authStore";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";

const CustomerContact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const { user } = useAuthStore();
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

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const apiUrl = import.meta.env.MODE === "development" 
        ? "http://localhost:5000/api/messages" 
        : "/api/messages";
      await axios.post(apiUrl, formData);
      toast.success("Message sent successfully!");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
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
            backgroundImage: "url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-blue-900 bg-opacity-80 flex items-center justify-center">
            <h1 className="text-4xl font-bold text-white">CONTACT US</h1>
          </div>
        </div>

        {/* Contact Section */}
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Information */}
                <div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-6">Get in Touch</h2>
                  
                  {contactInfo ? (
                    <div className="space-y-6">
                      <div className="flex items-start">
                        <MapPin className="w-6 h-6 text-blue-600 mr-3 mt-1" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Address</h3>
                          <p className="text-gray-600 mt-1">{contactInfo.address}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Clock className="w-6 h-6 text-blue-600 mr-3 mt-1" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Opening Hours</h3>
                          <p className="text-gray-600 mt-1">{contactInfo.hours}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Phone className="w-6 h-6 text-blue-600 mr-3 mt-1" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Phone</h3>
                          <p className="text-gray-600 mt-1">{contactInfo.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Mail className="w-6 h-6 text-blue-600 mr-3 mt-1" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Email</h3>
                          <p className="text-gray-600 mt-1">{contactInfo.email}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerContact;