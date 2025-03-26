import React, { useState, useEffect } from "react";
import { User, Search, Eye, XCircle, Loader } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/users" : "/api/users";

const UsersManager = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Fetch all users
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(API_URL, { 
                withCredentials: true // Include cookies with request
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Initial fetch on component mount
    useEffect(() => {
        fetchUsers();
    }, []);
    
    // Filter users based on search term
    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Format date
    const formatDate = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };
    
    // Get user details
    const getUserDetails = async (id) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/${id}`, {
                withCredentials: true // Include cookies with request
            });
            setSelectedUser(response.data);
        } catch (error) {
            console.error("Error fetching user details:", error);
            toast.error("Failed to fetch user details");
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading && !users.length) {
        return (
            <div className="p-6 h-full flex justify-center items-center">
                <Loader className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="p-6 h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-800">Users Management</h2>
            </div>
            
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Loader className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500">No users found.</p>
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <User className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{formatDate(user.createdAt)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${user.isAdmin ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                            {user.isAdmin ? 'Admin' : 'Customer'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            className="text-blue-600 hover:text-blue-900"
                                            onClick={() => getUserDetails(user._id)}
                                        >
                                            <Eye className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">User Profile</h3>
                            <button 
                                onClick={() => setSelectedUser(null)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="px-6 py-4">
                            <div className="flex justify-center mb-4">
                                <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="h-12 w-12 text-blue-600" />
                                </div>
                            </div>
                            
                            <div className="text-center mb-6">
                                <h4 className="text-xl font-medium text-gray-900">{selectedUser.name}</h4>
                                <p className="text-gray-600">{selectedUser.email}</p>
                                <p className="text-sm text-gray-500 mt-1">Registered on {formatDate(selectedUser.createdAt)}</p>
                                <div className="mt-2">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        selectedUser.isAdmin ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                                    }`}>
                                        {selectedUser.isAdmin ? "Admin" : "Customer"}
                                    </span>
                                </div>
                            </div>
                            
                            {selectedUser.phone && (
                                <div className="border-t border-gray-200 pt-4 pb-2">
                                    <p className="text-sm text-gray-500">Phone</p>
                                    <p className="font-medium">{selectedUser.phone}</p>
                                </div>
                            )}
                            
                            {selectedUser.lastLogin && (
                                <div className="border-t border-gray-200 pt-4 pb-2">
                                    <p className="text-sm text-gray-500">Last Login</p>
                                    <p className="font-medium">{formatDate(selectedUser.lastLogin)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersManager;
