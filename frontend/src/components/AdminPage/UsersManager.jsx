import React, { useState, useEffect } from "react";
import {
  User,
  Search,
  Eye,
  XCircle,
  Loader,
  Trash2,
  AlertTriangle,
  Users,
  Mail,
  Calendar,
  Shield,
  Phone,
  Clock,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";

const API_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000/api/users"
    : "/api/users";

const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    customers: 0,
    newThisMonth: 0,
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate user statistics
  const calculateStats = (usersData) => {
    const total = usersData.length;
    const admins = usersData.filter((user) => user.role === "admin").length;
    const customers = usersData.filter((user) => user.role !== "admin").length;

    // Calculate new users this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newThisMonth = usersData.filter((user) => {
      const userDate = new Date(user.createdAt);
      return (
        userDate.getMonth() === currentMonth &&
        userDate.getFullYear() === currentYear
      );
    }).length;

    setStats({ total, admins, customers, newThisMonth });
  };

  // Fetch all users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL, {
        withCredentials: true,
      });
      setUsers(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date
  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const formatDateShort = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Get user details
  const getUserDetails = async (id) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/${id}`, {
        withCredentials: true,
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
    const result = await Swal.fire({
      title: "Delete User?",
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
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      icon: "warning",
    });

    if (result.isConfirmed) {
      setIsDeleting(true);
      try {
        const response = await axios.delete(`${API_URL}/${id}`, {
          withCredentials: true,
        });

        const updatedUsers = users.filter((user) => user._id !== id);
        setUsers(updatedUsers);
        calculateStats(updatedUsers);

        if (selectedUser && selectedUser._id === id) {
          setSelectedUser(null);
        }

        Swal.fire({
          title: "Deleted!",
          text:
            response.data.message || `${name} has been deleted successfully.`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error deleting user:", error);

        let errorMessage = "Failed to delete user.";

        if (error.response) {
          if (error.response.status === 404) {
            errorMessage = "User not found. It may have already been deleted.";
          } else if (error.response.status === 403) {
            errorMessage = "Admin users cannot be deleted.";
          } else if (error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          }
        }

        Swal.fire({
          title: "Error!",
          text: errorMessage,
          icon: "error",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (isLoading && !users.length) {
    return (
      <div className="p-6 h-full flex justify-center items-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-full pb-28">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3"></div>
            Users Management
          </h2>
          <p className="text-gray-600 mt-1">Manage and monitor user accounts</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Admins</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                {stats.admins}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Customers</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                {stats.customers}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                New This Month
              </p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                {stats.newThisMonth}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-12 w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table/Cards */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl font-medium text-gray-500">No users found</p>
          <p className="text-gray-400 mt-2">
            Try adjusting your search criteria
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                    >
                      Contact
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                    >
                      Registered
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                    >
                      Role
                    </th>
                    <th scope="col" className="relative px-6 py-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredUsers.map((user, index) => (
                    <tr
                      key={user._id}
                      className={`group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {user.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {user._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <div
                            className="text-sm text-gray-600 truncate max-w-[200px]"
                            title={user.email}
                          >
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div className="text-sm text-gray-600">
                            {formatDateShort(user.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full transition-all duration-300 ${
                            user.role === "admin"
                              ? "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 group-hover:from-purple-200 group-hover:to-purple-300"
                              : "bg-gradient-to-r from-green-100 to-green-200 text-green-800 group-hover:from-green-200 group-hover:to-green-300"
                          }`}
                        >
                          {user.role === "admin" ? "Admin" : "Customer"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => getUserDetails(user._id)}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl inline-flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="font-medium">View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{user.name}</h3>
                      <p className="text-xs text-gray-500">
                        ID: {user._id.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded-full ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.role === "admin" ? "Admin" : "Customer"}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 truncate">
                      {user.email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatDateShort(user.createdAt)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => getUserDetails(user._id)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 rounded-xl flex items-center justify-center space-x-2 transition-all duration-300"
                >
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">View Details</span>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Enhanced User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">User Profile</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-center mb-6">
                <div className="h-24 w-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-12 w-12 text-white" />
                </div>
              </div>

              <div className="text-center mb-6">
                <h4 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedUser.name}
                </h4>
                <div className="mb-3">
                  <span
                    className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full ${
                      selectedUser.role === "admin"
                        ? "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800"
                        : "bg-gradient-to-r from-green-100 to-green-200 text-green-800"
                    }`}
                  >
                    {selectedUser.role === "admin" ? "Admin" : "Customer"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-medium text-gray-500">Email</p>
                  </div>
                  <p className="font-semibold text-gray-900 break-all ml-8">
                    {selectedUser.email}
                  </p>
                </div>

                {selectedUser.phone && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <Phone className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                    </div>
                    <p className="font-semibold text-gray-900 ml-8">
                      {selectedUser.phone}
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <p className="text-sm font-medium text-gray-500">Joined</p>
                  </div>
                  <p className="font-semibold text-gray-900 ml-8">
                    {formatDate(selectedUser.createdAt)}
                  </p>
                </div>

                {selectedUser.lastLogin && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <p className="text-sm font-medium text-gray-500">
                        Last Login
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 ml-8">
                      {formatDate(selectedUser.lastLogin)}
                    </p>
                  </div>
                )}
              </div>

              {/* Delete button for non-admin users */}
              {selectedUser.role !== "admin" && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setTimeout(() => {
                        deleteUser(selectedUser._id, selectedUser.name);
                      }, 100);
                    }}
                    disabled={isDeleting}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span>Delete User</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay during delete operation */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex items-center space-x-4">
            <div className="relative">
              <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
            </div>
            <p className="font-medium text-gray-700">Deleting user...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManager;
