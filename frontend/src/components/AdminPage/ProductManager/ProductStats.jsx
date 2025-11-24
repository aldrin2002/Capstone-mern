import React from 'react';
import { Package, ShoppingBag, Star, Coins } from 'lucide-react';

const ProductStats = ({ stats }) => {
  const statItems = [
    {
      label: 'Total Products',
      value: stats.total,
      icon: Package,
      color: 'blue',
      hoverColor: 'blue'
    },
    {
      label: 'In Stock',
      value: stats.inStock,
      icon: ShoppingBag,
      color: 'green',
      hoverColor: 'green'
    },
    {
      label: 'Out of Stock',
      value: stats.outOfStock,
      icon: Star,
      color: 'red',
      hoverColor: 'red'
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-lg p-4 md:p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{item.label}</p>
                <p className={`text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-${item.hoverColor}-600 transition-colors`}>
                  {item.value}
                </p>
              </div>
              <div className={`p-3 bg-${item.color}-50 rounded-xl group-hover:bg-${item.color}-100 transition-colors`}>
                <Icon className={`w-6 h-6 text-${item.color}-600`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductStats;