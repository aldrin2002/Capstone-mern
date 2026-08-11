import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  Eye, 
  Database, 
  MessageCircle, 
  CreditCard,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const PrivacyPolicy = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const lastUpdated = "July 2026"; // You can dynamically set this date if needed

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 to-primary-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand via-primary-700 to-primary-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-4">
            <Link 
              to="/costumerSignup" 
              className="flex items-center text-primary-200 hover:text-white transition-colors mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Signup
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <Shield className="h-12 w-12 mr-4" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
              <p className="text-primary-200 mt-2">Last updated: {lastUpdated}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 md:p-12">
            
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="h-6 w-6 mr-3 text-brand" />
                Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Welcome to CafeX ("we," "our," or "us"). This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our cafe management and 
                ordering system, including our website, mobile application, and related services 
                (collectively, the "Service").
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Database className="h-6 w-6 mr-3 text-brand" />
                Information We Collect
              </h2>
              
              <div className="space-y-6">
                <div className="bg-primary-100 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Personal Information
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Account Information:</strong> Name, email address, phone number</li>
                    <li>• <strong>Profile Data:</strong> Customer preferences and order history</li>
                    <li>• <strong>Contact Information:</strong> Delivery addresses and contact details</li>
                  </ul>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-brand" />
                    Order and Payment Information
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Order Details:</strong> Items ordered, quantities, prices, and order status</li>
                    <li>• <strong>Payment Information:</strong> Payment method preferences</li>
                    <li>• <strong>Transaction History:</strong> Order history and payment records</li>
                  </ul>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-purple-600" />
                    Communication Data
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Messages:</strong> Customer support conversations and real-time chat messages</li>
                    {/* <li>• <strong>Attachments:</strong> Images or files shared through our messaging system</li> */}
                  </ul>
                </div>

                {/* <div className="bg-yellow-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Eye className="h-5 w-5 mr-2 text-yellow-600" />
                    Technical Information
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Device Information:</strong> IP address, browser type, device type</li>
                    <li>• <strong>Usage Data:</strong> Pages visited, time spent, click patterns</li>
                    <li>• <strong>Connection Data:</strong> Online status and real-time connection information</li>
                  </ul>
                </div> */}
              </div>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-6 w-6 mr-3 text-green-600" />
                How We Use Your Information
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Service Operations</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Process and fulfill your orders</li>
                    <li>• Manage your account and preferences</li>
                    <li>• Provide customer support</li>
                    <li>• Send order confirmations and updates</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Communication</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Real-time messaging with cafe staff</li>
                    <li>• Order status notifications</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Improvement</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Analyze usage patterns</li>
                    <li>• Improve our services</li>
                    <li>• Develop new features</li>
                    <li>• Ensure system security</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Legal Compliance</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Comply with legal obligations</li>
                    <li>• Prevent fraud and abuse</li>
                    <li>• Protect our rights and property</li>
                    <li>• Ensure user safety</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Information Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="h-6 w-6 mr-3 text-red-600" />
                Information Sharing and Disclosure
              </h2>
              
              <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="text-lg font-semibold text-red-800">We Do Not Sell Your Data</h3>
                </div>
                <p className="text-red-700">
                  We do not sell, trade, or otherwise transfer your personal information to third parties for marketing purposes.
                </p>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">We may share information in these limited circumstances:</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span><strong>Service Providers:</strong> Third-party services that help us operate (payment processors, cloud storage, analytics)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span><strong>Legal Requirements:</strong> When required by law or to protect our rights</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of business assets</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span><strong>Consent:</strong> With your explicit permission for specific purposes</span>
                </li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="h-6 w-6 mr-3 text-brand" />
                Data Security
              </h2>
              
              <div className="bg-primary-100 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  We implement appropriate technical and organizational security measures to protect your personal information:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-gray-700">
                    <li>• SSL/TLS encryption for data transmission</li>
                    <li>• Secure password hashing (bcrypt)</li>
                    <li>• JWT token-based authentication</li>
                    <li>• Regular security updates</li>
                  </ul>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Access controls and user permissions</li>
                    <li>• Secure cloud storage (Cloudinary)</li>
                    <li>• Regular data backups</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="h-6 w-6 mr-3 text-green-600" />
                Your Privacy Rights
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Access & Portability</h3>
                    <p className="text-gray-700 text-sm">Request a copy of your personal data and download your information.</p>
                  </div>
                  
                  <div className="bg-primary-100 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Correction</h3>
                    <p className="text-gray-700 text-sm">Update or correct inaccurate personal information in your account.</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Deletion</h3>
                    <p className="text-gray-700 text-sm">Request deletion of your personal data (subject to legal requirements).</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Opt-out</h3>
                    <p className="text-gray-700 text-sm">Unsubscribe from marketing communications at any time.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Cookies and Tracking */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking Technologies</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  We use cookies and similar technologies to enhance your experience:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Essential Cookies:</strong> Required for basic functionality (authentication, session management)</li>
                  <li>• <strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                  <li>• <strong>Analytics Cookies:</strong> Help us understand how you use our service</li>
                  <li>• <strong>Real-time Data:</strong> Socket.IO for live messaging and order updates</li>
                </ul>
              </div>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Phone className="h-6 w-6 mr-3 text-brand" />
                Contact Us
              </h2>
              <div className="bg-primary-100 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  If you have any questions about this Privacy Policy or want to exercise your privacy rights, please contact us:
                </p>
                <div className="space-y-2 text-gray-700">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-brand" />
                    <span>Email: chentots7@gmail.com</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-brand" />
                    <span>Phone: (+63) 912-464-7745</span>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2 text-brand" />
                    <span>Live Chat: Available through our customer messaging system</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Changes to Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6">
                <p className="text-gray-700">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by 
                  posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to 
                  review this Privacy Policy periodically for any changes.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t pt-8 text-center">
              <p className="text-gray-600 mb-4">
                By using CafeX, you acknowledge that you have read and understood this Privacy Policy.
              </p>
              <Link 
                to="/costumerSignup" 
                className="inline-flex items-center px-6 py-3 bg-brand text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Signup
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;