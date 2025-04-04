import { useAuthStore } from "../../store/authStore";
import { Link } from "react-router-dom";
import CustomerSideNav from "./customerSideNav";
import { Menu, ShoppingBag, Image, Phone } from "lucide-react";

const CustomerDashboard = () => {
  const { user } = useAuthStore();
  const isMobile = window.innerWidth < 768;

  // Quick access cards data
  const quickAccessCards = [
    {
      title: "Our Menu",
      description: "Explore our delicious offerings",
      link: "/customer-menu",
      bgColor: "bg-blue-100",
      icon: <Menu className="h-6 w-6 mb-2 text-blue-600" />
    },
    {
      title: "Order Now",
      description: "Place your order online",
      link: "/customer-buy",
      bgColor: "bg-yellow-100",
      icon: <ShoppingBag className="h-6 w-6 mb-2 text-yellow-600" />
    },
    {
      title: "Gallery",
      description: "View our cafe's ambiance",
      link: "/customer-gallery",
      bgColor: "bg-green-100",
      icon: <Image className="h-6 w-6 mb-2 text-green-600" />
    },
    {
      title: "Contact Us",
      description: "Get in touch with us",
      link: "/customer-contact",
      bgColor: "bg-purple-100",
      icon: <Phone className="h-6 w-6 mb-2 text-purple-600" />
    },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 relative">
      {/* Sidebar */}
      <CustomerSideNav />

      {/* Main Content */}
      <main className={`flex-1 bg-white ${isMobile ? 'pb-20' : 'pb-0'}`}>
        {/* Welcome Section */}
        <div className="bg-blue-900 text-white py-12 px-4">
          <div className="container mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold">Welcome, {user?.name || "Guest"}!</h1>
            <p className="mt-2 text-blue-200">Explore our cafe's offerings and place your order online.</p>
          </div>
        </div>

        {/* Quick Access Section */}
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Quick Access</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {quickAccessCards.map((card, index) => (
              <Link 
                key={index} 
                to={card.link}
                className={`${card.bgColor} p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center text-center`}
              >
                {card.icon}
                <h3 className="text-lg md:text-xl font-semibold mb-1">{card.title}</h3>
                <p className="text-sm md:text-base text-gray-600">{card.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;