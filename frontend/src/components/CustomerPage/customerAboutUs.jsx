import { useState } from "react";
import CustomerSideNav from "../../pages/customer/customerSideNav";

const CustomerAboutUs = () => {
  return (
    <div className="flex min-h-screen bg-gray-100 relative">
      {/* Sidebar */}
      <CustomerSideNav />

      {/* Main Content */}
      <main className="flex-1 bg-white">
        {/* Header Section */}
        <div
          className="relative bg-cover bg-center h-64"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-blue-900 bg-opacity-80 flex items-center justify-center">
            <h1 className="text-4xl font-bold text-white">ABOUT US</h1>
          </div>
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-blue-900 mb-3">Our Story</h3>
                  <p className="text-gray-700">
                    Founded in 2023, our cafe started as a small passion project by a group of 
                    coffee enthusiasts who wanted to create a cozy space for people to enjoy 
                    quality beverages and food. What began as a simple idea has now grown into 
                    a beloved community hub where people gather to work, socialize, and enjoy 
                    our carefully crafted menu items.
                  </p>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-blue-900 mb-3">Our Mission</h3>
                  <p className="text-gray-700">
                    We are committed to serving the highest quality coffee and food while creating 
                    a welcoming environment for our community. We source our ingredients locally 
                    whenever possible and strive to minimize our environmental impact through 
                    sustainable practices.
                  </p>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-blue-900 mb-3">Beneficiaries</h3>
                  <p className="text-gray-700">
                    This project was developed to benefit local coffee shops and their customers by 
                    providing a modern digital platform for managing cafe operations and improving 
                    customer experience through online ordering and loyalty programs.
                  </p>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-blue-900 mb-3">Project Overview</h3>
                  <p className="text-gray-700">
                    The Cafe Management System is a comprehensive solution developed as part of 
                    our final year project, aiming to digitize traditional cafe operations. 
                    The system includes features for inventory management, order processing, 
                    customer relationship management, and real-time analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerAboutUs;
