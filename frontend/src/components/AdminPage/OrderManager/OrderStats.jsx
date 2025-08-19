import React from "react";
import { 
  ShoppingCart, 
  Clock, 
  Package, 
  CheckCircle, 
  XCircle, 
  DollarSign 
} from "lucide-react";

const OrderStats = ({ stats }) => {
  const statCards = [
    {
      title: "Total Orders",
      value: stats.total,
      icon: ShoppingCart,
      color: "blue",
      hoverColor: "blue"
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "yellow",
      hoverColor: "yellow"
    },
    {
      title: "Processing",
      value: stats.processing,
      icon: Package,
      color: "blue",
      hoverColor: "blue"
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "green",
      hoverColor: "green"
    },
    {
      title: "Cancelled",
      value: stats.cancelled,
      icon: XCircle,
      color: "red",
      hoverColor: "red"
    },
    {
      title: "Revenue",
      value: `₱${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "purple",
      hoverColor: "purple",
      isRevenue: true
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-2xl shadow-lg p-4 md:p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className={`text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-${stat.hoverColor}-600 transition-colors ${stat.isRevenue ? 'text-lg md:text-xl' : ''}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 bg-${stat.color}-50 rounded-xl group-hover:bg-${stat.color}-100 transition-colors`}>
                <Icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderStats;