import React, { useState, useEffect } from "react";
import { Phone, Mail, MapPin, Clock, Globe, Save, Loader } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

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
            toast.error("Failed to load contact information");
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
        setIsLoading(true);
        
        try {
            const response = await axios.put(API_URL, formData, {
                withCredentials: true
            });
            setContactInfo(response.data);
            setIsEditing(false);
            toast.success("Contact information updated successfully");
        } catch (error) {
            console.error("Error updating contact info:", error);
            toast.error("Failed to update contact information");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Cancel editing
    const handleCancel = () => {
        setFormData(contactInfo);
        setIsEditing(false);
    };
    
    return (
        <div className={`p-6 ${isMobile ? 'pb-28' : ''}`}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Contact Information</h2>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Edit Information
                    </button>
                )}
            </div>
            
            {isLoading && !isEditing ? (
                <div className="flex justify-center my-12">
                    <Loader className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
            ) : isEditing ? (
                <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="p-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="+1 (123) 456-7890"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-gray-700 font-medium mb-2">Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-gray-700 font-medium mb-2">Business Hours</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Clock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="hours"
                                    value={formData.hours}
                                    onChange={handleChange}
                                    className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Mon-Fri: 8am-8pm, Sat-Sun: 9am-5pm"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-gray-700 font-medium mb-2">Website</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Globe className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://example.com"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Facebook</label>
                            <input
                                type="text"
                                name="socialMedia.facebook"
                                value={formData.socialMedia.facebook}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://facebook.com/yourpage"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Instagram</label>
                            <input
                                type="text"
                                name="socialMedia.instagram"
                                value={formData.socialMedia.instagram}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://instagram.com/yourhandle"
                            />
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-gray-700 font-medium mb-2">Twitter</label>
                            <input
                                type="text"
                                name="socialMedia.twitter"
                                value={formData.socialMedia.twitter}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://twitter.com/yourhandle"
                            />
                        </div>
                    </div>
                    
                    <div className={`mt-6 flex justify-end ${isMobile ? 'sticky bottom-0 bg-white py-4 border-t' : ''}`}>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="mr-3 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader className="h-5 w-5 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-5 w-5 mr-2" />
                            )}
                            Save Changes
                        </button>
                    </div>
                </form>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start">
                            <Phone className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-gray-800">Phone</h3>
                                <p className="text-gray-600">{contactInfo.phone}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <Mail className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-gray-800">Email</h3>
                                <p className="text-gray-600">{contactInfo.email}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start md:col-span-2">
                            <MapPin className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-gray-800">Address</h3>
                                <p className="text-gray-600">{contactInfo.address}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start md:col-span-2">
                            <Clock className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-gray-800">Business Hours</h3>
                                <p className="text-gray-600">{contactInfo.hours}</p>
                            </div>
                        </div>
                        
                        {contactInfo.website && (
                            <div className="flex items-start md:col-span-2">
                                <Globe className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                                <div>
                                    <h3 className="font-medium text-gray-800">Website</h3>
                                    <a 
                                        href={contactInfo.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        {contactInfo.website}
                                    </a>
                                </div>
                            </div>
                        )}
                        
                        {(contactInfo.socialMedia.facebook || contactInfo.socialMedia.instagram || contactInfo.socialMedia.twitter) && (
                            <div className="flex items-start md:col-span-2">
                                <div className="h-5 w-5 text-blue-600 mr-3 mt-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-800">Social Media</h3>
                                    <div className="flex flex-wrap gap-3 mt-2">
                                        {contactInfo.socialMedia.facebook && (
                                            <a 
                                                href={contactInfo.socialMedia.facebook} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Facebook
                                            </a>
                                        )}
                                        {contactInfo.socialMedia.instagram && (
                                            <a 
                                                href={contactInfo.socialMedia.instagram} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-pink-600 hover:underline"
                                            >
                                                Instagram
                                            </a>
                                        )}
                                        {contactInfo.socialMedia.twitter && (
                                            <a 
                                                href={contactInfo.socialMedia.twitter} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:underline"
                                            >
                                                Twitter
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactManager;
