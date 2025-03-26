import React, { useState, useEffect } from "react";
import { Image, PlusCircle, Trash2, Edit2, Eye, Search, Loader, XCircle } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/gallery" : "/api/gallery";
// Add API base URL for images
const API_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";

const GalleryManager = () => {
    const [gallery, setGallery] = useState([]);
    const [viewMode, setViewMode] = useState("grid"); // grid or list
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingImage, setEditingImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Update the state to include imagePreview
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        image: null,
        featured: false
    });

    const [imagePreview, setImagePreview] = useState(null);

    // Fetch gallery images
    const fetchGallery = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(API_URL, {
                withCredentials: true // Include cookies with request
            });
            setGallery(response.data);
        } catch (error) {
            console.error("Error fetching gallery:", error);
            toast.error("Failed to load gallery images");
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch on component mount
    useEffect(() => {
        fetchGallery();
    }, []);

    // Update handleChange to handle both text inputs and file uploads
    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        
        if (type === 'file') {
            const file = files[0];
            setFormData(prev => ({
                ...prev,
                [name]: file
            }));
            
            // Create preview for image
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setImagePreview(null);
            }
        } else if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Update resetForm function
    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            image: null,
            featured: false
        });
        setImagePreview(null);
        setEditingImage(null);
        setShowModal(false);
    };

    // Update handleEditImage 
    const handleEditImage = (image) => {
        setEditingImage(image);
        setFormData({
            title: image.title,
            description: image.description || "",
            image: null, // Don't set the file object, just leave it null
            featured: image.featured || false
        });
        
        // Set image preview from the current image
        setImagePreview(image.image ? `${API_BASE_URL}${image.image}` : null);
        
        setShowModal(true);
    };

    // Update handleSubmit to use FormData for file upload
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Create FormData object for file upload
            const galleryData = new FormData();
            galleryData.append('title', formData.title);
            galleryData.append('description', formData.description);
            galleryData.append('featured', formData.featured);
            
            // Only append file if it exists (for new images or when updating image)
            if (formData.image) {
                galleryData.append('image', formData.image);
            }
            
            if (editingImage) {
                // Update existing image
                await axios.put(`${API_URL}/${editingImage._id}`, galleryData, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                toast.success("Gallery image updated successfully");
            } else {
                // Add new image
                await axios.post(API_URL, galleryData, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                toast.success("Gallery image added successfully");
            }
            
            // Refresh gallery and reset form
            fetchGallery();
            resetForm();
        } catch (error) {
            console.error("Error saving gallery image:", error);
            toast.error(editingImage ? "Failed to update gallery image" : "Failed to add gallery image");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle delete gallery image
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this image?")) {
            return;
        }
        
        setIsLoading(true);
        try {
            await axios.delete(`${API_URL}/${id}`, {
                withCredentials: true // Include cookies with request
            });
            toast.success("Gallery image deleted successfully");
            fetchGallery();
        } catch (error) {
            console.error("Error deleting gallery image:", error);
            toast.error("Failed to delete gallery image");
        } finally {
            setIsLoading(false);
        }
    };

    // Add filtering function
    const filteredGallery = gallery.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-800">Gallery Management</h2>
                <button 
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => setShowModal(true)}
                >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Image
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search gallery images..."
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex justify-end">
                    <div className="inline-flex rounded-lg overflow-hidden">
                        <button
                            className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                            onClick={() => setViewMode('grid')}
                        >
                            Grid
                        </button>
                        <button
                            className={`px-4 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                            onClick={() => setViewMode('list')}
                        >
                            List
                        </button>
                    </div>
                </div>
            </div>
            
            {isLoading && !gallery.length ? (
                <div className="flex justify-center items-center h-64">
                    <Loader className="h-10 w-10 text-blue-500 animate-spin" />
                </div>
            ) : filteredGallery.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500">No gallery images found. Add some!</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredGallery.map((image) => (
                        <div key={image._id} className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="relative h-48">
                                <img 
                                    src={`${API_BASE_URL}${image.image}`}
                                    alt={image.title} 
                                    className="w-full h-full object-cover"
                                />
                                {image.featured && (
                                    <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg">
                                        Featured
                                    </span>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-medium text-gray-900 mb-1">{image.title}</h3>
                                {image.description && (
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{image.description}</p>
                                )}
                                <div className="flex justify-end mt-2">
                                    <button 
                                        className="p-1 text-blue-600 hover:text-blue-800 mr-2"
                                        onClick={() => handleEditImage(image)}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button 
                                        className="p-1 text-red-600 hover:text-red-800"
                                        onClick={() => handleDelete(image._id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredGallery.map((image) => (
                                <tr key={image._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="h-16 w-16 rounded overflow-hidden bg-gray-100">
                                            <img 
                                                src={`${API_BASE_URL}${image.image}`}
                                                alt={image.title} 
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{image.title}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 line-clamp-2">{image.description || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${image.featured ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {image.featured ? 'Featured' : 'Not Featured'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                            onClick={() => handleEditImage(image)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button 
                                            className="text-red-600 hover:text-red-900"
                                            onClick={() => handleDelete(image._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Modal for adding/editing gallery image */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
                        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">
                                {editingImage ? "Edit Gallery Image" : "Add Gallery Image"}
                            </h3>
                            <button 
                                onClick={resetForm}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="px-6 py-4">
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.description}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>
                                
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
                                        Image
                                    </label>
                                    <input
                                        type="file"
                                        id="image"
                                        name="image"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onChange={handleChange}
                                        accept="image/*"
                                        required={!editingImage}
                                    />
                                    {imagePreview && (
                                        <div className="mt-2">
                                            <img 
                                                src={imagePreview} 
                                                alt="Gallery preview" 
                                                className="h-48 object-contain border rounded"
                                            />
                                        </div>
                                    )}
                                    {editingImage && !formData.image && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Leave empty to keep the current image
                                        </p>
                                    )}
                                </div>
                                
                                <div className="mb-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="featured"
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            checked={formData.featured}
                                            onChange={handleChange}
                                        />
                                        <span className="ml-2 text-gray-700">Featured image</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
                                <button
                                    type="button"
                                    className="mr-2 px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader className="h-5 w-5 animate-spin" />
                                    ) : (
                                        editingImage ? "Update" : "Add"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GalleryManager;
