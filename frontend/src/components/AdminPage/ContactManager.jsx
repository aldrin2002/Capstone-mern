import React, { useState, useEffect } from "react";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Globe, 
  Save, 
  Loader, 
  Edit2, 
  X, 
  Facebook, 
  Instagram, 
  Twitter,
  Building,
  Users,
  Contact
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/contact" : "/api/contact";

const ContactManager = () => {
    const [contactInfo, setContactInfo] = useState({
        phone: "",
        email: "",
        address: "",
        hours: "",
        website: "",
        socialMedia: {
            facebook: "",
            instagram: "",
            twitter: ""
        }
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState(contactInfo);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Fetch contact information
    const fetchContactInfo = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(API_URL);
            if (response.data) {
                setContactInfo(response.data);
                setFormData(response.data);
            }
        } catch (error) {
            console.error("Error fetching contact info:", error);
            Swal.fire({
                icon: 'error',
                title: 'Load Failed',
                text: 'Failed to load contact information',
                confirmButtonColor: '#F13E93',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    // Initial fetch on component mount
    useEffect(() => {
        fetchContactInfo();
    }, []);
    
    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData({
                ...formData,
                [parent]: {
                    ...formData[parent],
                    [child]: value
                }
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };
    
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic form validation
        if (!formData.email || !formData.address || !formData.hours) {
            Swal.fire({
                icon: 'warning',
                title: 'Required Fields Missing',
                text: 'Please fill in all required fields (Email, Address, and Business Hours)',
                confirmButtonColor: '#F13E93',
            });
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid Email',
                text: 'Please enter a valid email address',
                confirmButtonColor: '#F13E93',
            });
            return;
        }
        
        // Website validation (if provided)
        if (formData.website && !formData.website.startsWith('http')) {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid Website URL',
                text: 'Website URL should start with http:// or https://',
                confirmButtonColor: '#F13E93',
            });
            return;
        }
        
        // Show loading state
        Swal.fire({
            title: 'Saving...',
            html: 'Please wait while we save your changes',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        setIsLoading(true);
        
        try {
            const response = await axios.put(API_URL, formData, {
                withCredentials: true
            });
            setContactInfo(response.data);
            setIsEditing(false);
            
            Swal.fire({
                icon: 'success',
                title: 'Saved!',
                text: 'Contact information updated successfully',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error updating contact info:", error);
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: error.response?.data?.message || 'Failed to update contact information',
                confirmButtonColor: '#F13E93',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    // Cancel editing
    const handleCancel = () => {
        // Check if form data has changed
        const hasChanges = JSON.stringify(formData) !== JSON.stringify(contactInfo);
        
        if (hasChanges) {
            Swal.fire({
                title: 'Discard Changes?',
                text: 'Any unsaved changes will be lost',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#F13E93',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, discard',
                cancelButtonText: 'No, keep editing'
            }).then((result) => {
                if (result.isConfirmed) {
                    setFormData(contactInfo);
                    setIsEditing(false);
                }
            });
        } else {
            setFormData(contactInfo);
            setIsEditing(false);
        }
    };

    if (isLoading && !isEditing) {
        return (
            <div className="p-6 h-full flex justify-center items-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary-200 border-t-brand rounded-full animate-spin mx-auto"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-8 h-8 bg-brand rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <p className="mt-4 text-gray-600 font-medium">Loading contact information...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className={`p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-primary-100 min-h-full ${isMobile ? 'pb-28' : ''}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                        <div className="w-2 h-8 bg-gradient-to-b from-brand to-primary-700 rounded-full mr-3"></div>
                        Contact Management
                    </h2>
                    <p className="text-gray-600 mt-1">Manage your cafe contact information</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-gradient-to-r from-brand to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-2xl flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        <Edit2 className="h-5 w-5" />
                        <span className="font-medium">Edit Information</span>
                    </button>
                )}
            </div>

            {/* Contact Information Display/Edit */}
            {isEditing ? (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-brand to-primary-700 p-6 text-white">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">Edit Contact Information</h3>
                            <button
                                onClick={handleCancel}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Phone */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="pl-12 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                                        placeholder="+1 (123) 456-7890"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">
                                    Email Address *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="pl-12 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                                        placeholder="contact@yourcafe.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700">
                                    Address *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="pl-12 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                                        placeholder="123 Main Street, City, State 12345"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Business Hours */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700">
                                    Business Hours *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Clock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="hours"
                                        value={formData.hours}
                                        onChange={handleChange}
                                        className="pl-12 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                                        placeholder="Mon-Fri: 8am-8pm, Sat-Sun: 9am-5pm"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Website */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700">
                                    Website
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Globe className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        className="pl-12 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                                        placeholder="https://yourcafe.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Social Media Section */}
                        <div className="mt-8">
                            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                <Users className="h-5 w-5 mr-2 text-brand" />
                                Social Media Links
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Facebook */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">
                                        Facebook
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Facebook className="h-5 w-5 text-brand" />
                                        </div>
                                        <input
                                            type="text"
                                            name="socialMedia.facebook"
                                            value={formData.socialMedia.facebook}
                                            onChange={handleChange}
                                            className="pl-12 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                                            placeholder="https://facebook.com/yourpage"
                                        />
                                    </div>
                                </div>

                                {/* Instagram */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">
                                        Instagram
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Instagram className="h-5 w-5 text-pink-600" />
                                        </div>
                                        <input
                                            type="text"
                                            name="socialMedia.instagram"
                                            value={formData.socialMedia.instagram}
                                            onChange={handleChange}
                                            className="pl-12 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                                            placeholder="https://instagram.com/yourhandle"
                                        />
                                    </div>
                                </div>

                                {/* Twitter */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">
                                        Twitter
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Twitter className="h-5 w-5 text-brand" />
                                        </div>
                                        <input
                                            type="text"
                                            name="socialMedia.twitter"
                                            value={formData.socialMedia.twitter}
                                            onChange={handleChange}
                                            className="pl-12 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                                            placeholder="https://twitter.com/yourhandle"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3 pt-8 border-t border-gray-200 mt-8">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-gradient-to-r from-brand to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="h-5 w-5" />
                                )}
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                /* Display Mode */
                <div className="space-y-6">
                    {/* Contact Information Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Phone Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 group-hover:scale-110 transition-all duration-300">
                                    <Phone className="h-6 w-6 text-brand" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 group-hover:text-brand transition-colors">Phone</h3>
                                    <p className="text-gray-600">{contactInfo.phone || "Not set"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Email Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 group-hover:scale-110 transition-all duration-300">
                                    <Mail className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 group-hover:text-green-600 transition-colors">Email</h3>
                                    <p className="text-gray-600">{contactInfo.email || "Not set"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Address Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 md:col-span-2">
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 group-hover:scale-110 transition-all duration-300">
                                    <MapPin className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 group-hover:text-purple-600 transition-colors">Address</h3>
                                    <p className="text-gray-600">{contactInfo.address || "Not set"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Business Hours Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 md:col-span-2">
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-orange-50 rounded-xl group-hover:bg-orange-100 group-hover:scale-110 transition-all duration-300">
                                    <Clock className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors">Business Hours</h3>
                                    <p className="text-gray-600">{contactInfo.hours || "Not set"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Website Card */}
                        {contactInfo.website && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 md:col-span-2">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 group-hover:scale-110 transition-all duration-300">
                                        <Globe className="h-6 w-6 text-brand" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 group-hover:text-brand transition-colors">Website</h3>
                                        <a 
                                            href={contactInfo.website} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-brand hover:text-primary-800 hover:underline transition-colors"
                                        >
                                            {contactInfo.website}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Social Media Section */}
                    {(contactInfo.socialMedia?.facebook || contactInfo.socialMedia?.instagram || contactInfo.socialMedia?.twitter) && (
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                                <Users className="h-6 w-6 mr-3 text-brand" />
                                Social Media
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {contactInfo.socialMedia?.facebook && (
                                    <a 
                                        href={contactInfo.socialMedia.facebook} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-3 p-4 bg-primary-100 rounded-xl hover:bg-primary-200 transition-all duration-300 transform hover:scale-105"
                                    >
                                        <Facebook className="h-6 w-6 text-brand" />
                                        <span className="font-medium text-primary-800">Facebook</span>
                                    </a>
                                )}
                                {contactInfo.socialMedia?.instagram && (
                                    <a 
                                        href={contactInfo.socialMedia.instagram} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-3 p-4 bg-pink-50 rounded-xl hover:bg-pink-100 transition-all duration-300 transform hover:scale-105"
                                    >
                                        <Instagram className="h-6 w-6 text-pink-600" />
                                        <span className="font-medium text-pink-800">Instagram</span>
                                    </a>
                                )}
                                {contactInfo.socialMedia?.twitter && (
                                    <a 
                                        href={contactInfo.socialMedia.twitter} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-3 p-4 bg-primary-100 rounded-xl hover:bg-primary-200 transition-all duration-300 transform hover:scale-105"
                                    >
                                        <Twitter className="h-6 w-6 text-brand" />
                                        <span className="font-medium text-primary-800">Twitter</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContactManager;
