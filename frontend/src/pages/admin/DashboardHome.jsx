import React, { useState, useEffect } from "react";
import { Loader, TrendingUp, TrendingDown, Users, ShoppingBag, DollarSign, Package, ShoppingCart, Image, Phone, Eye } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const DashboardHome = ({ user, setActiveComponent, isMobile }) => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      // Fetch products count
      const productsResponse = await axios.get(
        import.meta.env.MODE === "development"
          ? "http://localhost:5000/api/products"
          : "/api/products",
        { withCredentials: true }
      );

      // Fetch orders
      const ordersResponse = await axios.get(
        import.meta.env.MODE === "development"
          ? "http://localhost:5000/api/orders"
          : "/api/orders",
        { withCredentials: true }
      );

      // Fetch users
      const usersResponse = await axios.get(
        import.meta.env.MODE === "development"
          ? "http://localhost:5000/api/users"
          : "/api/users",
        { withCredentials: true }
      );

      // Calculate total revenue
      const totalRevenue = ordersResponse.data
        .filter((order) => order.status !== "Cancelled")
        .reduce((sum, order) => sum + order.total, 0);

      // Get orders from last month
      const lastMonthOrders = ordersResponse.data.filter((order) => {
        const orderDate = new Date(order.createdAt);
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return orderDate >= lastMonth;
      });

      // Calculate changes
      const lastMonthRevenue = lastMonthOrders
        .filter((order) => order.status !== "Cancelled")
        .reduce((sum, order) => sum + order.total, 0);

      const revenueChange =
        totalRevenue > 0
          ? `+${((lastMonthRevenue / totalRevenue) * 100).toFixed(0)}%`
          : "+0%";

      const orderChange =
        ordersResponse.data.length > 0
          ? `+${(
              (lastMonthOrders.length / ordersResponse.data.length) *
              100
            ).toFixed(0)}%`
          : "+0%";

      setStats([
        {
          label: "Total Orders",
          value: ordersResponse.data.length.toString(),
          change: orderChange,
          changeType: "positive",
          icon: ShoppingCart,
          color: "from-blue-500 to-blue-600",
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600"
        },
        {
          label: "Revenue",
          value: `₱${totalRevenue.toFixed(2)}`,
          change: revenueChange,
          changeType: "positive",
          icon: DollarSign,
          color: "from-green-500 to-green-600",
          bgColor: "bg-green-50",
          iconColor: "text-green-600"
        },
        {
          label: "Products",
          value: productsResponse.data.length.toString(),
          change: `+${
            productsResponse.data.length > 0 ? productsResponse.data.length : 0
          }`,
          changeType: "positive",
          icon: Package,
          color: "from-purple-500 to-purple-600",
          bgColor: "bg-purple-50",
          iconColor: "text-purple-600"
        },
        {
          label: "Users",
          value: usersResponse.data.length.toString(),
          change: `+${
            usersResponse.data.length > 0 ? usersResponse.data.length : 0
          }`,
          changeType: "positive",
          icon: Users,
          color: "from-orange-500 to-orange-600",
          bgColor: "bg-orange-50",
          iconColor: "text-orange-600"
        },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
      toast.error("Failed to load dashboard statistics");

      // Set fallback stats
      setStats([
        {
          label: "Total Orders",
          value: "0",
          change: "0%",
          changeType: "neutral",
          icon: ShoppingCart,
          color: "from-gray-400 to-gray-500",
          bgColor: "bg-gray-50",
          iconColor: "text-gray-500"
        },
        {
          label: "Revenue",
          value: "₱0.00",
          change: "0%",
          changeType: "neutral",
          icon: DollarSign,
          color: "from-gray-400 to-gray-500",
          bgColor: "bg-gray-50",
          iconColor: "text-gray-500"
        },
        { 
          label: "Products", 
          value: "0", 
          change: "0", 
          changeType: "neutral",
          icon: Package,
          color: "from-gray-400 to-gray-500",
          bgColor: "bg-gray-50",
          iconColor: "text-gray-500"
        },
        { 
          label: "Users", 
          value: "0", 
          change: "0", 
          changeType: "neutral",
          icon: Users,
          color: "from-gray-400 to-gray-500",
          bgColor: "bg-gray-50",
          iconColor: "text-gray-500"
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const quickActions = [
    {
      title: "Manage Orders",
      description: "View and process customer orders",
      action: "orders",
      icon: ShoppingCart,
      gradient: "from-blue-500 to-blue-600",
      hoverGradient: "from-blue-600 to-blue-700"
    },
    {
      title: "Add Products",
      description: "Create and manage menu items",
      action: "products",
      icon: Package,
      gradient: "from-green-500 to-green-600",
      hoverGradient: "from-green-600 to-green-700"
    },
    {
      title: "Update Gallery",
      description: "Manage cafe photos and images",
      action: "gallery",
      icon: Image,
      gradient: "from-purple-500 to-purple-600",
      hoverGradient: "from-purple-600 to-purple-700"
    },
    {
      title: "Contact Info",
      description: "Update business contact details",
      action: "contact",
      icon: Phone,
      gradient: "from-orange-500 to-orange-600",
      hoverGradient: "from-orange-600 to-orange-700"
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-full">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats &&
          stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={index} 
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                {/* Gradient Background */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -mr-16 -mt-16`}></div>
                
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                    <div className="flex items-center space-x-1">
                      {stat.changeType === "positive" ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : stat.changeType === "negative" ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : null}
                      <span className={`text-sm font-medium ${
                        stat.changeType === "positive" ? "text-green-500" : 
                        stat.changeType === "negative" ? "text-red-500" : "text-gray-500"
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    {stat.label}
                  </h3>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Since last month</p>
                </div>
              </div>
            );
          })}
      </div>

      {/* Enhanced Welcome Section */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Welcome Back!</h2>
              <p className="text-blue-100 text-lg">{user.name}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group">
              <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 group-hover:bg-blue-50 transition-colors duration-300">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900">{user.email}</p>
                </div>
              </div>
            </div>
            
            <div className="group">
              <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 group-hover:bg-green-50 transition-colors duration-300">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Joined</p>
                  <p className="font-semibold text-gray-900">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </div>
            
            <div className="group">
              <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 group-hover:bg-purple-50 transition-colors duration-300">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Login</p>
                  <p className="font-semibold text-gray-900">{formatDate(user.lastLogin)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${isMobile ? "mb-20" : ""}`}>
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3"></div>
            Quick Actions
          </h2>
          <p className="text-gray-500 mt-1">Manage your cafe efficiently</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => setActiveComponent(action.action)}
                  className="group relative p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left overflow-hidden"
                >
                  {/* Animated background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className={`p-3 bg-gradient-to-br ${action.gradient} rounded-xl group-hover:bg-white group-hover:bg-opacity-20 transition-all duration-300 transform group-hover:scale-110`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 group-hover:text-white transition-colors duration-300">
                          {action.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 group-hover:text-white group-hover:text-opacity-90 transition-colors duration-300">
                      {action.description}
                    </p>
                  </div>
                  
                  {/* Hover effect indicator */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;