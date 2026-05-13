import { Link } from 'react-router-dom';
import { Coffee, Star, Clock, Users, Download, TrendingUp, Menu, X } from 'lucide-react'; // ✅ Add TrendingUp
import { useEffect, useState } from 'react';
import cafeDelicityLogo from '../assets/cafe-delicity-logo.jpg';

// ✅ NEW: Simple Visit Counter Component
const VisitCounter = () => {
  const [visitCount, setVisitCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const recordAndFetchVisit = async () => {
      const apiUrl = import.meta.env.MODE === "development" 
        ? "http://localhost:5000/api/visits" 
        : "/api/visits";

      // Check sessionStorage to prevent multiple counts in same tab
      const sessionRecorded = sessionStorage.getItem('cafex-visit-recorded');
      
      if (sessionRecorded) {
        // Just fetch count
        try {
          const countResponse = await fetch(`${apiUrl}/count`);
          const countData = await countResponse.json();
          if (countData.success) {
            setVisitCount(countData.totalVisits);
          }
        } catch (error) {
          console.error('Error fetching count:', error);
        }
        setIsLoading(false);
        return;
      }

      // Record new visit
      try {
        const recordResponse = await fetch(`${apiUrl}/record`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const recordData = await recordResponse.json();
        
        if (recordData.success) {
          setVisitCount(recordData.totalVisits);
          sessionStorage.setItem('cafex-visit-recorded', 'true');
        }
      } catch (error) {
        console.error('Error recording visit:', error);
      } finally {
        setIsLoading(false);
      }
    };

    recordAndFetchVisit();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-white text-sm sm:text-base">
        <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
        <span className="font-medium">Loading...</span>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-white text-sm sm:text-base transition-all duration-300 hover:bg-white/30"
      title={`Total visits: ${visitCount}`}
    >
      <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span className="font-medium">Visits:</span>
      <span className="font-bold">{visitCount}</span>
    </div>
  );
};

// Install PWA Component
const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    const detectIOS = () => {
      const userAgent = navigator.userAgent || "";
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      // iPadOS 13+ reports as MacIntel but has touch points.
      const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
      return isIOS || isIPadOS;
    };

    setIsIOSDevice(detectIOS());

    // Function to check if app is currently installed
    const checkInstallationStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebApk = window.navigator.standalone === true; // iOS
      return isStandalone || isInWebApk;
    };

    // Function to check if we should show install button
    const shouldShowInstallButton = () => {
      const isCurrentlyInstalled = checkInstallationStatus();
      const wasInstalledBefore = localStorage.getItem('pwa-installed') === 'true';
      
      // If currently installed, mark as installed and don't show button
      if (isCurrentlyInstalled) {
        setIsAppInstalled(true);
        setShowInstallButton(false);
        // Update localStorage to reflect current status
        localStorage.setItem('pwa-installed', 'true');
        return false;
      }
      
      // If not currently installed but was installed before, 
      // it means the app was uninstalled - reset the state
      if (!isCurrentlyInstalled && wasInstalledBefore) {
        console.log('App was uninstalled, resetting install state');
        localStorage.removeItem('pwa-installed');
        setIsAppInstalled(false);
        // Don't show button yet, wait for beforeinstallprompt
        return false;
      }
      
      // If never installed and not currently installed
      if (!isCurrentlyInstalled && !wasInstalledBefore) {
        setIsAppInstalled(false);
        // Will show button when beforeinstallprompt fires
        return false;
      }
      
      return false;
    };

    // Initial check
    shouldShowInstallButton();

    // iOS Safari never fires beforeinstallprompt; show a button that opens instructions.
    if (detectIOS() && !checkInstallationStatus()) {
      setShowInstallButton(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt fired');
      // Prevent Chrome from automatically showing the prompt
      e.preventDefault();
      // Only store prompt and show button if app is not installed
      if (!checkInstallationStatus()) {
        setInstallPrompt(e);
        setShowInstallButton(true);
        setIsAppInstalled(false);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setInstallPrompt(null);
      setIsAppInstalled(true);
      setShowInstallButton(false);
      // Store installation status
      localStorage.setItem('pwa-installed', 'true');
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check periodically if app status changed (for uninstall detection)
    const intervalId = setInterval(() => {
      const currentlyInstalled = checkInstallationStatus();
      const wasInstalledBefore = localStorage.getItem('pwa-installed') === 'true';
      
      // If was installed before but not currently installed = uninstalled
      if (wasInstalledBefore && !currentlyInstalled) {
        console.log('App uninstalled detected');
        localStorage.removeItem('pwa-installed');
        setIsAppInstalled(false);
        setShowInstallButton(false); // Will show when beforeinstallprompt fires again
      }
    }, 5000); // Check every 5 seconds

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(intervalId);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      // If on iOS, show instructions for adding to home screen
      if (isIOSDevice) {
        alert("To install this app on iOS: tap the share icon and then 'Add to Home Screen'");
      } else if (isAppInstalled) {
        alert("App is already installed!");
      } else {
        alert("Installation is not supported on this browser or app is not ready for installation");
      }
      return;
    }
    
    try {
      // Show the install prompt
      installPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await installPrompt.userChoice;
      
      console.log(`User response: ${choiceResult.outcome}`);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        // The appinstalled event will handle the state update
      } else {
        console.log('User dismissed the install prompt');
        // Reset prompt but keep showing button for next time
        setInstallPrompt(null);
      }
    } catch (error) {
      console.error('Error during installation:', error);
      setInstallPrompt(null);
    }
  };

  // Show on iOS (instructions) or when beforeinstallprompt is available.
  if (isAppInstalled || !showInstallButton) {
    return null;
  }
  
  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center justify-center gap-1.5 bg-white text-brand 
                px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-semibold 
                hover:bg-white/90 transition duration-200 text-sm sm:text-base 
                whitespace-nowrap min-w-[106px] sm:min-w-[120px]"
      aria-label="Install App"
    >
      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span>Install App</span>
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
  const [isNavOpen, setIsNavOpen] = useState(false);

  const navLinks = [
    { to: '/login', label: 'Admin' },
    { to: '/costumerLogin', label: 'Customer' },
    { to: '/driverLogin', label: 'Driver' },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isNavOpen) {
        setIsNavOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isNavOpen]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-b from-brand via-primary-700 to-primary-900">
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
<header className="relative z-20 bg-white/10 backdrop-blur-md border-b border-white/20">
  <div className="container mx-auto flex items-center justify-between py-4 px-4 sm:px-6">
    
    <Link to="/" className="flex items-center" aria-label="Cafe Delicity">
      
      {/* Logo Container (circle) */}
      <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden flex items-center justify-center bg-white/20">
        <img
          src={cafeDelicityLogo}
          alt="Cafe Delicity"
          className="h-full w-full object-contain"
        />
      </div>

    </Link>

          <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <VisitCounter />
            <InstallPWA />
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-white hover:text-primary-200 transition-colors text-sm sm:text-base"
              >
                {label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            aria-label="Toggle navigation"
            className="md:hidden inline-flex items-center justify-center rounded-lg bg-white/20 text-white p-2 hover:bg-white/30 transition"
            onClick={() => setIsNavOpen((prev) => !prev)}
          >
            {isNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isNavOpen && (
          <div className="md:hidden bg-primary-900/95 backdrop-blur-lg border-t border-white/10">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <div className="flex flex-wrap gap-3">
                <VisitCounter />
                <InstallPWA />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {navLinks.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setIsNavOpen(false)}
                    className="text-white hover:text-primary-200 transition-colors text-base text-center py-2 rounded-lg bg-white/10"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content - Keep all existing code */}
      <main className="flex-grow relative z-10">
        {/* Hero Section */}
        <section className="h-[500px] flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-2xl mx-4">
            <h1 className="text-5xl font-bold mb-4 text-white text-center">
              Welcome to Cafe Delicity
            </h1>
            <p className="text-xl mb-8 text-white/80 text-center">
              Your Centralized Platform for Cafe
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/costumerLogin"
                className="bg-brand text-white px-8 py-3 rounded-lg font-semibold 
                                             hover:bg-brand/90 transition duration-200 text-center"
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
              Why Choose Cafe Delicity?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { icon: Coffee, title: "Premium Coffee", desc: "Expertly sourced and perfectly brewed coffee" },
                { icon: Star, title: "Quality Service", desc: "Professional and friendly customer service" },
                { icon: Clock, title: "Simple Ordering", desc: "Quick and simple online ordering system" },
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
              <h3 className="text-xl font-bold mb-4 text-white">Cafe Delicity </h3>
              <p className="text-white/70">Powered by CafeX</p>
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