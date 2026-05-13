import React, { useState, useEffect } from "react";
import {
  Image,
  PlusCircle,
  Trash2,
  Edit2,
  Eye,
  Search,
  Loader,
  XCircle,
  Star,
  Grid,
  List,
  Filter,
  X,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";

// Update these constants at the top
const API_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000/api/gallery"
    : "/api/gallery";
const API_BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5000" : "";

const GalleryManager = () => {
  const [gallery, setGallery] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [filterType, setFilterType] = useState("all");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null,
    featured: false,
  });

  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchGallery = async () => {
    setIsLoading(true);
    try {
      // Add timestamp to prevent browser caching
      const timestamp = new Date().getTime();
      
      const response = await axios.get(`${API_URL}?t=${timestamp}`, {
        withCredentials: true,
      });

      setGallery(response.data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Load Failed",
        text: "Failed to load gallery images",
        confirmButtonColor: "#F13E93",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const file = files[0];

      if (file && file.size > 10 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "File Too Large",
          text: "Image must be less than 10MB",
          confirmButtonColor: "#F13E93",
        });
        e.target.value = null;
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));

      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    } else if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image: null,
      featured: false,
    });
    setImagePreview(null);
    setEditingImage(null);
    setShowModal(false);
  };

  const handleEditImage = (image) => {
    setEditingImage(image);
    setFormData({
      title: image.title,
      description: image.description || "",
      image: null,
      featured: image.featured || false,
    });

    setImagePreview(
      image.image
        ? image.image.startsWith("https://")
          ? image.image
          : `${API_BASE_URL}${image.image}`
        : null
    );
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🔄 GALLERY SUBMIT - Starting submit process");
    console.log("📋 Form data:", formData);

    if (!formData.title.trim()) {
      // Your validation logic...
      return;
    }

    if (!editingImage && !formData.image) {
      // Your validation logic...
      return;
    }

    Swal.fire({
      title: "Processing...",
      html: "Please wait while we save your changes",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    setIsLoading(true);

    try {
      console.log("🔄 GALLERY SUBMIT - Creating FormData");

      // Create a FormData object - EXACTLY like ProductManager
      const galleryData = new FormData();
      galleryData.append("title", formData.title);
      galleryData.append("description", formData.description || "");
      galleryData.append("featured", formData.featured);

      // Debug logging - check what's being sent
      for (let [key, value] of galleryData.entries()) {
        console.log(`FormData ${key}:`, value);
      }

      // If a new image is selected, attach it directly - like ProductManager
      if (formData.image) {
        console.log("📸 Adding image to FormData:", {
          name: formData.image.name,
          size: formData.image.size,
          type: formData.image.type,
        });
        galleryData.append("image", formData.image);
      } else {
        console.log("📸 No new image to upload, keeping existing image");
      }

      console.log("🌐 GALLERY SUBMIT - Making API request");

      if (editingImage) {
        console.log("✏️ Updating existing gallery image:", editingImage._id);
        const response = await axios.put(`${API_URL}/${editingImage._id}`, galleryData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });

        console.log("✅ Gallery image updated successfully:", response.data);
        console.log("📸 New image URL:", response.data.image);

        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Gallery image updated successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        console.log("➕ Creating new gallery image");
        const response = await axios.post(API_URL, galleryData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });

        console.log("✅ Gallery image created successfully:", response.data);
        console.log("📸 Image URL:", response.data.image);

        Swal.fire({
          icon: "success",
          title: "Added!",
          text: "Gallery image added successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      console.log("🔄 GALLERY SUBMIT - Refreshing gallery data");
      await fetchGallery(); // Add a timestamp parameter here
      resetForm();
    } catch (error) {
      console.error("❌ GALLERY ERROR - Failed to save gallery image:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: error.response?.data?.message || "An error occurred while saving the image",
        confirmButtonColor: "#F13E93",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Confirm Deletion",
      html: `Are you sure you want to delete <strong>${title}</strong>?<br><span class="text-red-600 text-sm">This action cannot be undone!</span>`,
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#F13E93",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    Swal.fire({
      title: "Deleting...",
      html: "Please wait while we delete the image",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`, {
        withCredentials: true,
      });

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Gallery image deleted successfully",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchGallery();
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: "Failed to delete gallery image",
        confirmButtonColor: "#F13E93",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced filtering
  const filteredGallery = gallery.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter =
      filterType === "all" ||
      (filterType === "featured" && item.featured) ||
      (filterType === "regular" && !item.featured);

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: gallery.length,
    featured: gallery.filter((img) => img.featured).length,
    regular: gallery.filter((img) => !img.featured).length,
  };

  if (isLoading && gallery.length === 0) {
    return (
      <div className="p-6 h-full flex justify-center items-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-brand rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-brand rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-primary-100 min-h-full pb-28">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
            <div className="w-2 h-8 bg-gradient-to-b from-brand to-primary-700 rounded-full mr-3"></div>
            Gallery Management
          </h2>
          <p className="text-gray-600 mt-1">Manage your cafe gallery images</p>
        </div>
        <button
          onClick={() => {
            setEditingImage(null);
            setFormData({
              title: "",
              description: "",
              image: null,
              featured: false,
            });
            setImagePreview(null);
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-brand to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-2xl flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <PlusCircle className="h-5 w-5" />
          <span className="font-medium">Add Image</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Images</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-brand transition-colors">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors">
              <Image className="w-6 h-6 text-brand" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Featured</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">
                {stats.featured}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl group-hover:bg-yellow-100 transition-colors">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Regular</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                {stats.regular}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
              <Image className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Controls */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 md:mr-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-12 w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                placeholder="Search gallery by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Filter Dropdown */}
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
              >
                <option value="all">All Images</option>
                <option value="featured">Featured Only</option>
                <option value="regular">Regular Only</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === "grid"
                    ? "bg-brand text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === "list"
                    ? "bg-brand text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Content */}
      {filteredGallery.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl font-medium text-gray-500">No images found</p>
          <p className="text-gray-400 mt-2">
            {gallery.length === 0
              ? "Get started by adding your first image"
              : "Try adjusting your search or filter criteria"}
          </p>
          {gallery.length === 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-brand to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-2xl flex items-center space-x-2 mx-auto transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <PlusCircle className="h-5 w-5" />
                <span className="font-medium">Add First Image</span>
              </button>
            </div>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredGallery.map((image) => (
            <div
              key={image._id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  // Use the image URL directly if it's from Cloudinary (starting with https://res.cloudinary.com)
                  src={
                    image.image &&
                    (image.image.includes("cloudinary.com") ||
                      image.image.startsWith("http"))
                      ? image.image
                      : `${API_BASE_URL}${image.image}`
                  }
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />

                {/* Featured Badge */}
                {image.featured && (
                  <div className="absolute top-3 right-3">
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full flex items-center space-x-1 text-xs font-bold shadow-lg">
                      <Star className="w-3 h-3" />
                      <span>Featured</span>
                    </div>
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditImage(image)}
                      className="p-3 bg-brand hover:bg-primary-700 text-white rounded-full shadow-lg transform hover:scale-110 transition-all duration-300"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(image._id, image.title)}
                      className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transform hover:scale-110 transition-all duration-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-brand transition-colors">
                  {image.title}
                </h3>
                {image.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {image.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                  >
                    Image
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                  >
                    Title
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredGallery.map((image, index) => (
                  <tr
                    key={image._id}
                    className={`group hover:bg-gradient-to-r hover:from-primary-100 hover:to-purple-50 transition-all duration-300 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-100 group-hover:scale-110 transition-transform duration-300">
                        <img
                          src={
                            image.image &&
                            (image.image.includes("cloudinary.com") ||
                              image.image.startsWith("http"))
                              ? image.image
                              : `${API_BASE_URL}${image.image}`
                          }
                          alt={image.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">
                        {image.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {image.description || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {image.featured ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 group-hover:from-yellow-200 group-hover:to-yellow-300 transition-all duration-300">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 group-hover:from-gray-200 group-hover:to-gray-300 transition-all duration-300">
                          Regular
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditImage(image)}
                          className="bg-gradient-to-r from-brand to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white p-2 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(image._id, image.title)}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-2 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enhanced Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-brand to-primary-700 p-6 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">
                  {editingImage ? "Edit Gallery Image" : "Add New Image"}
                </h3>
                <button
                  onClick={() => {
                    const hasChanges =
                      formData.title ||
                      formData.description ||
                      formData.image ||
                      formData.featured;

                    if (hasChanges) {
                      Swal.fire({
                        title: "Discard Changes?",
                        text: "Any unsaved changes will be lost",
                        icon: "question",
                        showCancelButton: true,
                        confirmButtonColor: "#F13E93",
                        cancelButtonColor: "#d33",
                        confirmButtonText: "Yes, discard",
                        cancelButtonText: "No, keep editing",
                      }).then((result) => {
                        if (result.isConfirmed) {
                          resetForm();
                        }
                      });
                    } else {
                      resetForm();
                    }
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Image Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                    required
                    placeholder="Enter image title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300 resize-none"
                    placeholder="Describe the image (optional)"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Image File
                  </label>
                  <input
                    type="file"
                    name="image"
                    onChange={handleChange}
                    accept="image/*"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                    required={!editingImage}
                  />
                  {imagePreview && (
                    <div className="mt-4 relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-xl border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData({ ...formData, image: null });
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {editingImage && !formData.image && (
                    <p className="text-sm text-gray-500 mt-2">
                      Leave empty to keep the current image
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="h-5 w-5 text-brand rounded border-gray-300 focus:ring-brand"
                  />
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="text-gray-700 font-medium">
                      Mark as featured image
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      const hasChanges =
                        formData.title ||
                        formData.description ||
                        formData.image ||
                        formData.featured;

                      if (hasChanges) {
                        Swal.fire({
                          title: "Discard Changes?",
                          text: "Any unsaved changes will be lost",
                          icon: "question",
                          showCancelButton: true,
                          confirmButtonColor: "#F13E93",
                          cancelButtonColor: "#d33",
                          confirmButtonText: "Yes, discard",
                          cancelButtonText: "No, keep editing",
                        }).then((result) => {
                          if (result.isConfirmed) {
                            resetForm();
                          }
                        });
                      } else {
                        resetForm();
                      }
                    }}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
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
                      <>
                        <span>{editingImage ? "Update" : "Add"} Image</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryManager;
