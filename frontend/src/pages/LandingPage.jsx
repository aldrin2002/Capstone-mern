import { Link } from 'react-router-dom';
import { Coffee, Star, Clock, Users, Download } from 'lucide-react';
import { useEffect, useState } from 'react';

// Install PWA Component
const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      // Update state to show installed status
      setInstallPrompt(null);
      setIsAppInstalled(true);
      console.log('PWA was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      // If on iOS, show instructions for adding to home screen
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        alert("To install this app on iOS: tap the share icon and then 'Add to Home Screen'");
      } else if (isAppInstalled) {
        alert("App is already installed!");
      } else {
        // For other browsers that don't support installation
        alert("Installation is not supported on this browser");
      }
      return;
    }
    
    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    
    // Reset the deferred prompt variable
    setInstallPrompt(null);
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
  };

  // Determine button text and styles based on installation status
  const buttonText = isAppInstalled ? "Open App" : "Install App";
  const buttonIcon = isAppInstalled ? "external-link" : "download";
  
  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center justify-center gap-1.5 bg-white text-primary-700 
                px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-semibold 
                hover:bg-white/90 transition duration-200 text-sm sm:text-base 
                whitespace-nowrap min-w-[106px] sm:min-w-[120px]"
      aria-label={buttonText}
    >
      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span>{buttonText}</span>
    </button>
  );
};

// Contact Section Component
const ContactSection = () => {
  const [contactData, setContactData] = useState(null);

  useEffect(() => {
    const fetchContactData = async () => {
      const apiUrl = import.meta.env.MODE === "development" 
        ? "http://localhost:5000/api/contact" 
        : "/api/contact";
        
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        setContactData(data);
      } catch (error) {
        console.error('Error fetching contact data:', error);
      }
    };

    fetchContactData();
  }, []);

  if (!contactData) {
    return <p className="text-white/70">Loading contact information...</p>;
  }

  return (
    <div>
      <h4 className="text-lg font-semibold mb-4 text-white">Contact Us</h4>
      <p className="text-white/70">{contactData.address}</p>
      <p className="text-white/70">{contactData.city}</p>
      <p className="text-white/70">{contactData.zip}</p>
      <p className="text-white/70">{contactData.country}</p>
    </div>
  );
};

// Main Landing Page Component
const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-b from-primary-500 to-primary-900">
      {/* Meteor Effect */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className={`absolute h-0.5 w-0.5 ${
              i % 2 === 0 ? 'animate-meteor' : 'animate-meteor-slow'
            }`}
            style={{
              top: `${Math.random() * -20}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            <div 
              className="absolute h-0.5 w-[100px] bg-gradient-to-r from-white to-transparent"
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto flex justify-between items-center py-4 px-6">
          <h1 className="text-2xl font-bold text-white">CafeX</h1>
          <nav className="flex items-center space-x-4">
            <InstallPWA />
            <Link to="/login" className="text-white hover:text-primary-200 transition-colors">
              Admin
            </Link> 
            <Link to="/costumerLogin" className="text-white hover:text-primary-200 transition-colors">
              Customer
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow relative z-10">
        {/* Hero Section */}
        <section className="h-[500px] flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-2xl mx-4">
            <h1 className="text-5xl font-bold mb-4 text-white text-center">
              Welcome to CafeX
            </h1>
            <p className="text-xl mb-8 text-white/80 text-center">
              Your Premium Coffee Experience Management System
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/costumerLogin"
                className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold 
                                             hover:bg-primary-700 transition duration-200 text-center"
              >
                Order Now
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">
              Why Choose CafeX?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { icon: Coffee, title: "Premium Coffee", desc: "Expertly sourced and perfectly brewed coffee" },
                { icon: Star, title: "Quality Service", desc: "Professional and friendly customer service" },
                { icon: Clock, title: "Fast Ordering", desc: "Quick and easy online ordering system" },
                { icon: Users, title: "Customer First", desc: "Dedicated to customer satisfaction" }
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 hover:bg-white/10 transition duration-300">
                  <Icon className="w-12 h-12 mx-auto mb-4 text-primary-200" />
                  <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
                  <p className="text-white/70">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-white/10 backdrop-blur-md border-t border-white/20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">CafeX</h3>
              <p className="text-white/70">Your Cafe Centralize Showcasing and Ordering System</p>
            </div>
            <ContactSection />
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Hours</h4>
              <p className="text-white/70">Monday - Saturday</p>
              <p className="text-white/70">8:00 AM - 8:00 PM</p>
              <p className="text-white/70">Closed on Sundays</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20 text-center">
            <p className="text-white/70">
              &copy; {new Date().getFullYear()} CafeX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;