import React, { useState, useEffect } from "react";
import { User, Search, Eye, XCircle, Loader, Trash2, AlertTriangle } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2"; // Import SweetAlert

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/users" : "/api/users";

const UsersManager = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
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

    // Delete user function
    const deleteUser = async (id, name) => {
        // Show confirmation dialog
        const result = await Swal.fire({
            title: 'Delete User?',
            html: `
                <div class="flex flex-col items-center">
                    <div class="bg-red-100 p-3 rounded-full mb-4">
                        <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </div>
                    <p>Are you sure you want to delete <strong>${name}</strong>?</p>
                    <p class="text-sm text-red-600 mt-2">This action cannot be undone!</p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            icon: 'warning',
            showClass: {
                popup: 'animate__animated animate__fadeIn'
            }
        });

        if (result.isConfirmed) {
            setIsDeleting(true);
            try {
                const response = await axios.delete(`${API_URL}/${id}`, {
                    withCredentials: true
                });
                
                // Remove deleted user from state
                setUsers(prevUsers => prevUsers.filter(user => user._id !== id));
                
                // Close user details modal if the deleted user is selected
                if (selectedUser && selectedUser._id === id) {
                    setSelectedUser(null);
                }
                
                Swal.fire({
                    title: 'Deleted!',
                    text: response.data.message || `${name} has been deleted successfully.`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error("Error deleting user:", error);
                
                // Handle specific error messages from the server
                let errorMessage = 'Failed to delete user.';
                
                if (error.response) {
                    if (error.response.status === 404) {
                        errorMessage = 'User not found. It may have already been deleted.';
                    } else if (error.response.status === 403) {
                        errorMessage = 'Admin users cannot be deleted.';
                    } else if (error.response.data && error.response.data.message) {
                        errorMessage = error.response.data.message;
                    }
                }
                
                Swal.fire({
                    title: 'Error!',
                    text: errorMessage,
                    icon: 'error'
                });
            } finally {
                setIsDeleting(false);
            }
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
        <div className="p-6 h-full pb-28">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-800">Users Management</h2>
            </div>
            
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {filteredUsers.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500">No users found</p>
                </div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Registered
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map(user => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`text-sm text-gray-500 ${isMobile ? "max-w-[120px] truncate" : ""}`} title={user.email}>
                                            {user.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{formatDate(user.createdAt)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${user.role === "admin" ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                            {user.role === "admin" ? 'Admin' : 'Customer'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex space-x-2 justify-end">
                                            <button 
                                                onClick={() => getUserDetails(user._id)}
                                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-md inline-flex items-center"
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                <span>View</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
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
                                <p className="text-gray-600 break-all">{selectedUser.email}</p>
                                <p className="text-sm text-gray-500 mt-1">Registered on {formatDate(selectedUser.createdAt)}</p>
                                <div className="mt-2">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        selectedUser.role === "admin" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                                    }`}>
                                        {selectedUser.role === "admin" ? "Admin" : "Customer"}
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

                            {/* Delete button in user profile - only for non-admin users */}
                            {selectedUser.role !== "admin" && (
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            setSelectedUser(null); // Close the modal first
                                            setTimeout(() => { // Small delay to ensure modal is closed
                                                deleteUser(selectedUser._id, selectedUser.name);
                                            }, 100);
                                        }}
                                        disabled={isDeleting}
                                        className="w-full bg-red-100 hover:bg-red-200 text-red-700 py-2 px-4 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 className="h-5 w-5 mr-2" />
                                        Delete User
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Loading overlay during delete operation */}
            {isDeleting && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
                        <Loader className="animate-spin h-6 w-6 mr-2 text-blue-600" />
                        <p>Deleting user...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersManager;
