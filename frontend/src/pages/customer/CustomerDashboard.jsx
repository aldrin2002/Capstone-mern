import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { Link } from "react-router-dom";
import CustomerSideNav from "./customerSideNav";
import { 
  Menu, 
  ShoppingBag, 
  Image, 
  Phone, 
  Coffee, 
  Star, 
  Users, 
  Clock,
  Heart,
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight
} from "lucide-react";

const CustomerDashboard = () => {
  const { user } = useAuthStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Quick access cards data with enhanced styling
  const quickAccessCards = [
    {
      title: "Our Menu",
      description: "Explore our delicious offerings",
      link: "/customer-menu",
      bgColor: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      icon: <Menu className="h-8 w-8 text-white" />,
      feature: "New Items Added"
    },
    {
      title: "Order Now",
      description: "Place your order online",
      link: "/customer-buy",
      bgColor: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
      icon: <ShoppingBag className="h-8 w-8 text-white" />,
      feature: "Fast Delivery"
    },
    {
      title: "Gallery",
      description: "View our cafe's ambiance",
      link: "/customer-gallery",
      bgColor: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      icon: <Image className="h-8 w-8 text-white" />,
      feature: "Latest Photos"
    },
    {
      title: "Contact Us",
      description: "Get in touch with us",
      link: "/customer-contact",
      bgColor: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
      icon: <Phone className="h-8 w-8 text-white" />,
      feature: "24/7 Support"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <CustomerSideNav />

        {/* Main Content - Offset by sidebar width on desktop */}
        <main className={`${isMobile ? 'pb-20' : 'ml-64'}`}>
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              {/* Greeting */}
              <div className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-full text-blue-100 text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4 mr-2" />
                {getGreeting()}, {user?.name || "Guest"}!
              </div>
              
              {/* Main heading */}
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Welcome to <span className="text-yellow-300">CafeX</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
                Discover exceptional coffee, delightful ambiance, and seamless online ordering experience
              </p>
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/customer-buy"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Order Now
                </Link>
                
                <Link 
                  to="/customer-menu"
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-8 py-4 rounded-xl font-semibold border border-white border-opacity-30 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                >
                  <Menu className="h-5 w-5 mr-2" />
                  View Menu
                </Link>
              </div>
            </div>
          </div>
        </div>

            {/* Stats Section */}
            <div className="container mx-auto px-4 py-12">
                {/* ... existing stats content ... */}
            </div>

            {/* Quick Access Section */}
            <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Quick Access
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Everything you need is just a click away. Explore our features and services.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {quickAccessCards.map((card, index) => (
              <Link 
                key={index} 
                to={card.link}
                className={`group ${card.bgColor} ${card.hoverColor} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden`}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
                
                {/* Feature badge */}
                <div className="absolute top-4 right-4 bg-white bg-opacity-20 rounded-full px-3 py-1 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {card.feature}
                </div>
                
                {/* Content */}
                <div className="relative">
                  {/* Icon */}
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {card.icon}
                    </div>
                  </div>
                  
                  {/* Text */}
                  <h3 className="text-xl font-bold text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-white text-opacity-90 text-sm leading-relaxed mb-4">
                    {card.description}
                  </p>
                  
                  {/* Arrow */}
                  <div className="flex justify-end">
                    <ChevronRight className="h-5 w-5 text-white text-opacity-60 group-hover:text-opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        </main>
    </div>
  );
};

export default CustomerDashboard;