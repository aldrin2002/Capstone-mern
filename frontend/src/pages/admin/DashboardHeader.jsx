import React from "react";
import { User } from "lucide-react";

const DashboardHeader = ({ activeComponent, user }) => {
  return (
    <header className="bg-white shadow-md z-10">
      <div className="px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-800">
          {activeComponent.charAt(0).toUpperCase() + activeComponent.slice(1)}
        </h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;