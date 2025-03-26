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
    
    // Fetch contact information
    const fetchContactInfo = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(API_URL);
            setContactInfo(response.data);
            setFormData(response.data);
        } catch (error) {
            console.error("Error fetching contact information:", error);
            toast.error("Failed to load contact information");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Initial fetch
    useEffect(() => {
        fetchContactInfo();
    }, []);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes(".")) {
            const [parent, child] = name.split(".");
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
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const response = await axios.put(API_URL, formData);
            setContactInfo(response.data);
            setIsEditing(false);
            toast.success("Contact information updated successfully");
        } catch (error) {
            console.error("Error updating contact information:", error);
            toast.error("Failed to update contact information");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCancel = () => {
        setFormData(contactInfo);
        setIsEditing(false);
    };
    
    if (isLoading && !isEditing) {
        return (
            <div className="p-6 h-full flex justify-center items-center">
                <Loader className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="p-6 h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-800">Contact Information</h2>
                <button 
                    onClick={isEditing ? handleCancel : () => setIsEditing(true)}
                    className={`px-4 py-2 ${isEditing ? 'bg-gray-500' : 'bg-blue-600'} text-white rounded-lg hover:${isEditing ? 'bg-gray-600' : 'bg-blue-700'} transition-colors`}
                    disabled={isLoading}
                >
                    {isEditing ? "Cancel" : "Edit Information"}
                </button>
            </div>
            
            {isEditing ? (
                <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
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
                                    required
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Website</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Globe className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-3">Social Media Links</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm mb-1">Facebook</label>
                                <input
                                    type="text"
                                    name="socialMedia.facebook"
                                    value={formData.socialMedia.facebook}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm mb-1">Instagram</label>
                                <input
                                    type="text"
                                    name="socialMedia.instagram"
                                    value={formData.socialMedia.instagram}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm mb-1">Twitter</label>
                                <input
                                    type="text"
                                    name="socialMedia.twitter"
                                    value={formData.socialMedia.twitter}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                        <button
                            type="submit"
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="bg-white shadow-md rounded-lg p-6">
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
                        
                        <div className="flex items-start">
                            <Globe className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-gray-800">Website</h3>
                                <p className="text-gray-600">{contactInfo.website}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <h3 className="font-medium text-gray-800 mb-3">Social Media</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-700">Facebook</h4>
                                <p className="text-gray-600 text-sm">{contactInfo.socialMedia.facebook}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-700">Instagram</h4>
                                <p className="text-gray-600 text-sm">{contactInfo.socialMedia.instagram}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-700">Twitter</h4>
                                <p className="text-gray-600 text-sm">{contactInfo.socialMedia.twitter}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactManager;
