import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  ShoppingCart, 
  CreditCard, 
  MessageCircle, 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Coffee,
  Users
} from 'lucide-react';

const TermsAndConditions = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const lastUpdated = "December 2024";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-4">
            <Link 
              to="/costumerSignup" 
              className="flex items-center text-blue-200 hover:text-white transition-colors mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Signup
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <FileText className="h-12 w-12 mr-4" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Terms & Conditions</h1>
              <p className="text-blue-200 mt-2">Last updated: {lastUpdated}</p>
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
                <Coffee className="h-6 w-6 mr-3 text-blue-600" />
                Welcome to CafeX
              </h2>
              <div className="bg-blue-50 rounded-lg p-6">
                <p className="text-gray-700 leading-relaxed">
                  These Terms and Conditions ("Terms") govern your use of the CafeX: A Centralized Platform For Cafe ("Service") operated by CafeX ("us", "we", or "our"). By accessing or 
                  using our Service, you agree to be bound by these Terms. If you disagree with any part 
                  of these terms, you may not access the Service.
                </p>
              </div>
            </section>

            {/* Account Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Users className="h-6 w-6 mr-3 text-green-600" />
                Account Registration and Responsibilities
              </h2>
              
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Account Creation
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• You must provide accurate, current, and complete information during registration</li>
                    <li>• You must be at least 16(+) years old to create an account</li>
                    <li>• You are responsible for safeguarding your account credentials</li>
                    <li>• You must notify us immediately of any unauthorized access to your account</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                    Account Security
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Use a strong, unique password for your account</li>
                    <li>• Do not share your login credentials with others</li>
                    <li>• Log out from shared or public devices</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Service Usage */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <ShoppingCart className="h-6 w-6 mr-3 text-blue-600" />
                Service Usage and Ordering
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Permitted Uses</h3>
                  <div className="bg-green-50 rounded-lg p-4">
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>• Browse and view our menu and gallery</li>
                      <li>• Place orders for food and beverages</li>
                      <li>• Communicate with cafe staff through messaging</li>
                      <li>• Track your order status in real-time</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Prohibited Uses</h3>
                  <div className="bg-red-50 rounded-lg p-4">
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>• Using the service for illegal activities</li>
                      <li>• Attempting to hack or disrupt the system</li>
                      <li>• Impersonating other users or staff</li>
                      <li>• Uploading malicious content or viruses</li>
                      <li>• Spamming or harassment through messaging</li>
                      <li>• Violating intellectual property rights</li>
                      <li>• BLANK</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Orders and Payments */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-6 w-6 mr-3 text-purple-600" />
                Orders, Payments, and Delivery
              </h2>
              
              <div className="space-y-6">
                <div className="bg-purple-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Process</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• All orders are subject to availability and acceptance</li>
                    <li>• We reserve the right to refuse or cancel orders at our discretion</li>
                    <li>• Order confirmation does not guarantee fulfillment</li>
                    <li>• Prices are subject to change without notice</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Terms</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Accepted Methods:</h4>
                      <ul className="space-y-1 text-gray-700 text-sm">
                        <li>• Cash on Delivery</li>
                        <li>• GCash (Online Payment by sending an Proof of Payment and the Reference Number)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Payment Rules:</h4>
                      <ul className="space-y-1 text-gray-700 text-sm">
                        <li>• Payment required before order processing</li>
                        <li>• Proof of payment required for online payments</li>
                        <li>• Delivery fee of ₱50.00 applies to all orders</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Status and Delivery</h3>
                  <div className="grid md:grid-cols-5 gap-2 mb-4">
                    {[
                      { status: 'Pending', color: 'bg-yellow-500', description: 'Order received and being reviewed' },
                      { status: 'Processing', color: 'bg-blue-500', description: 'Order is being prepared' },
                      { status: 'Delivered', color: 'bg-purple-500', description: 'Order is out for delivery' },
                      { status: 'Completed', color: 'bg-green-500', description: 'Order successfully completed' },
                      { status: 'Cancelled', color: 'bg-red-500', description: 'Order was cancelled' }
                    ].map((item, index) => (
                      <div key={index} className="text-center p-2">
                        <div className={`w-4 h-4 ${item.color} rounded-full mx-auto mb-1`}></div>
                        <p className="text-xs font-medium text-gray-700">{item.status}</p>
                      </div>
                    ))}
                  </div>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Real-time order status updates via notifications</li>
                    <li>• Estimated delivery times are approximate</li>
                    <li>• Delivery address must be accurate and complete</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Communication and Messaging */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <MessageCircle className="h-6 w-6 mr-3 text-indigo-600" />
                Communication and Messaging
              </h2>
              
              <div className="bg-indigo-50 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Real-time Messaging</h3>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>• Direct communication with cafe staff</li>
                      <li>• Real-time message delivery and notifications</li>
                      <li>• Image and file sharing capabilities</li>
                      <li>• Message history is maintained for your convenience</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Communication Guidelines</h3>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>• Keep messages relevant to your orders or inquiries</li>
                      <li>• Be respectful and courteous in all communications</li>
                      <li>• Do not share personal information unnecessarily</li>
                      <li>• Report any inappropriate behavior immediately</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Cancellation and Refunds */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <XCircle className="h-6 w-6 mr-3 text-red-600" />
                Cancellation and Refund Policy
              </h2>
              
              <div className="space-y-4">
                <div className="bg-red-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Cancellation Policy</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Orders can be cancelled within 5 minutes of placement</li>
                    <li>• Cancellation may not be possible once preparation has started</li>
                    <li>• Contact us immediately through messaging if cancellation is needed</li>
                    <li>• We reserve the right to cancel orders due to unavailability or other circumstances</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Refund Policy</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Refunds are processed for cancelled orders (before preparation)</li>
                    <li>• Quality issues will be addressed on a case-by-case basis</li>
                    <li>• Refund processing time: It Depends for online payments</li>
                    <li>• Cash orders will receive immediate refunds upon return</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="h-6 w-6 mr-3 text-purple-600" />
                Intellectual Property
              </h2>
              
              <div className="bg-purple-50 rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Rights</h3>
                    <p className="text-gray-700 text-sm mb-2">
                      The CafeX service, including its design, features, and content, is protected by intellectual property laws.
                    </p>
                    <ul className="space-y-1 text-gray-700 text-sm">
                      <li>• CafeX name, logo, and branding are our trademarks</li>
                      <li>• Software code and system architecture are proprietary</li>
                      <li>• Menu descriptions and cafe photography belong to us</li>
                      <li>• You may not copy, modify, or redistribute our content</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Content</h3>
                    <ul className="space-y-1 text-gray-700 text-sm">
                      <li>• You retain ownership of content you upload (reviews, messages, images)</li>
                      <li>• You grant us license to use your content for service operation</li>
                      <li>• You must not upload copyrighted material without permission</li>
                      <li>• We may remove content that violates these terms</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Limitation of Liability */}
                        <section className="mb-8">
                          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <AlertTriangle className="h-6 w-6 mr-3 text-yellow-600" />
                            Limitation of Liability
                          </h2>
                          
                          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6">
                            <div className="space-y-3 text-gray-700">
                              <p>
                                <strong>Service Availability:</strong> We strive to provide uninterrupted service but cannot guarantee 
                                100% uptime. We are not liable for service interruptions or technical issues.
                              </p>
                              <p>
                                <strong>Food Quality:</strong> While we maintain high standards, we cannot guarantee that our food 
                                will meet your individual preferences or dietary requirements.
                              </p>
                              <p>
                                <strong>Delivery:</strong> Delivery times are estimates. We are not liable for delays due to weather, 
                                traffic, or other circumstances beyond our control.
                              </p>
                              <p>
                                <strong>Data Security:</strong> While we implement security measures, no system is 100% secure. 
                                Use the service at your own risk.
                              </p>
                              <p>
                                <strong>Capstone Project Disclaimer:</strong> This system is developed as a capstone project by college student 
                                to address specific problem-solving requirements. The system may be subject to failures, incomplete functionality, 
                                or technical limitations. Users acknowledge that this is an academic project and may not perform with the same 
                                reliability as commercial-grade applications. We are not liable for any issues, data loss, or service disruptions 
                                that may occur during the use of this capstone system.
                              </p>
                            </div>
                          </div>
                        </section>

                        {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Termination</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Rights</h3>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>• You may stop using the service at any time</li>
                      <li>• Account deletion removes your personal data</li>
                      <li>• Order history and other data is deleted permanently for security & privacy purposes</li>
                      <li>• Outstanding orders must be completed or cancelled</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Our Rights</h3>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>• We may delete accounts for terms violations</li>
                      <li>• Permanent termination for serious breaches</li>
                      <li>• We may discontinue the service with notice</li>
                      <li>• Refunds processed according to our policy</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="h-6 w-6 mr-3 text-blue-600" />
                Changes to Terms
              </h2>
              <div className="bg-blue-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. 
                  We will notify users of significant changes through:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li>• Email notifications to registered users</li>
                  <li>• Prominent notices on our website</li>
                  <li>• Updated "Last modified" date on this page</li>
                </ul>
              </div>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="bg-green-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  If you have any questions about these Terms and Conditions, please contact us:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-gray-700">
                    <div className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-2 text-blue-600" />
                      <span>Live Chat: Available in the app</span>
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
                      <span>Email: chentots7@gmail.com</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex items-center">
                      <Coffee className="h-4 w-4 mr-2 text-blue-600" />
                      <span>Phone: (+63) 912-345-6789</span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-blue-600" />
                      <span>Business Hours:<br />Mon-Sun 10AM-8PM <br />Weekends: 8AM-10PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Agreement Footer */}
            <div className="border-t pt-8 text-center">
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Agreement</h3>
                <p className="text-gray-700">
                  By creating an account and using CafeX, you acknowledge that you have read, understood, 
                  and agree to be bound by these Terms and Conditions and our Privacy Policy.
                </p>
              </div>
              <Link 
                to="/costumerSignup" 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

export default TermsAndConditions;