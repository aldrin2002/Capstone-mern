import React from "react";
import { Search, Filter } from "lucide-react";

const OrderSearchFilter = ({ 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  handleStatusFilterChange,
  statuses 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by order ID or customer name..."
            className="pl-12 w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select 
            className="pl-12 w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default OrderSearchFilter;