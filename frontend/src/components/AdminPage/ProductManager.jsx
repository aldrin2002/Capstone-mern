import React, { useState, useEffect } from "react";
import {
  Coffee,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Loader,
  Plus,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2"; // Import SweetAlert2

const API_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000/api/products"
    : "/api/products";

// Add API base URL for images
const API_BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5000" : "";

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "Coffee",
    stock: "0", // Add stock field
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch products from API
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load products',
        confirmButtonColor: '#3085d6',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      const file = files[0];
      
      // Validate file size before setting
      if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Image must be less than 5MB',
          confirmButtonColor: '#3085d6',
        });
        e.target.value = null; // Reset input
        return;
      }
      
      setFormData({
        ...formData,
        [name]: file,
      });

      // Create image preview
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!formData.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Name Required',
        text: 'Please enter a product name',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Price',
        text: 'Please enter a valid price greater than zero',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    
    // If adding new product, require an image
    if (!editingProduct && !formData.image) {
      Swal.fire({
        icon: 'warning',
        title: 'Image Required',
        text: 'Please select an image for the product',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    
    // Show loading state
    Swal.fire({
      title: 'Processing...',
      html: 'Please wait while we save your changes',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    setIsLoading(true);

    // Create form data object for file upload
    const productData = new FormData();
    productData.append("name", formData.name);
    productData.append("price", formData.price);
    productData.append("description", formData.description);
    productData.append("category", formData.category);
    productData.append("stock", formData.stock); // Add stock
    if (formData.image) {
      productData.append("image", formData.image);
    }

    try {
      if (editingProduct) {
        // Update existing product
        await axios.put(`${API_URL}/${editingProduct._id}`, productData, {
          withCredentials: true,
        });
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Product updated successfully',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        // Create new product
        await axios.post(API_URL, productData, { withCredentials: true });
        Swal.fire({
          icon: 'success',
          title: 'Added!',
          text: 'Product added successfully',
          timer: 1500,
          showConfirmButton: false
        });
      }
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: error.response?.data?.message || "Failed to save product",
        confirmButtonColor: '#3085d6',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form and close modal
  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      description: "",
      category: "Coffee",
      stock: "0", // Add stock
      image: null,
    });
    setImagePreview(null);
    setEditingProduct(null);
    setShowModal(false);
  };

  // Edit product
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      category: product.category,
      stock: product.stock.toString(), // Add stock
      image: null,
    });
    setImagePreview(
      product.image ? `${API_BASE_URL}${product.image}` : null
    );
    setShowModal(true);
  };

  // Delete product
  const handleDelete = async (id) => {
    // Use SweetAlert for confirmation
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirm Deletion',
      text: 'Are you sure you want to delete this product?',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    
    if (!result.isConfirmed) {
      return; // User canceled the deletion
    }
    
    // Show loading state
    Swal.fire({
      title: 'Deleting...',
      html: 'Please wait while we delete the product',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Product deleted successfully',
        timer: 1500,
        showConfirmButton: false
      });
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: 'Failed to delete product',
        confirmButtonColor: '#3085d6',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products based on search term
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`p-6 ${isMobile ? 'pb-28' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="relative mb-4 md:mb-0 md:w-64">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add Product
        </button>
      </div>

      {isLoading && !showModal ? (
        <div className="flex justify-center my-12">
          <Loader className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="h-48 bg-gray-200 relative">
                {product.image ? (
                  <img
                    src={`${API_BASE_URL}${product.image}`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Coffee className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
                  >
                    <Edit2 className="h-4 w-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">
                    {product.name}
                  </h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                    {product.price.toFixed(2)}
                  </span>
                </div>
                <p className="mt-2 text-gray-600 text-sm line-clamp-2">
                  {product.description}
                </p>
                <div className="mt-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                    {product.category}
                  </span>
                </div>
                <div className="mt-1">
                  <span className={`px-2 py-1 text-xs rounded ${
                    product.stock > 0 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {product.stock > 0 ? `Stock: ${product.stock}` : "Out of stock"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={() => {
                  // Confirm before closing if form has changes
                  const hasChanges = formData.name || formData.price || formData.description || formData.image;
                  
                  if (hasChanges) {
                    Swal.fire({
                      title: 'Discard Changes?',
                      text: 'Any unsaved changes will be lost',
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonColor: '#3085d6',
                      cancelButtonColor: '#d33',
                      confirmButtonText: 'Yes, discard',
                      cancelButtonText: 'No, keep editing'
                    }).then((result) => {
                      if (result.isConfirmed) {
                        resetForm();
                      }
                    });
                  } else {
                    resetForm();
                  }
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₱)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Coffee">Coffee</option>
                  <option value="Tea">Milk Tea</option>
                  <option value="Pastry">Pastry</option>
                  <option value="Sandwich">Sandwich</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {/* Stock field - Add this before or after the Category field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image
                </label>
                <input
                  type="file"
                  name="image"
                  onChange={handleChange}
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required={!editingProduct}
                />
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-32 w-auto object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData({ ...formData, image: null });
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    >
                      &times;
                    </button>
                  </div>
                )}
                {editingProduct && !formData.image && (
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty to keep the current image
                  </p>
                )}
              </div>
              <div className={`flex justify-end ${isMobile ? 'sticky bottom-0 bg-white py-4 border-t mt-4' : ''}`}>
                <button
                  type="button"
                  onClick={() => {
                    // Same confirmation dialog as the X button
                    const hasChanges = formData.name || formData.price || formData.description || formData.image;
                    
                    if (hasChanges) {
                      Swal.fire({
                        title: 'Discard Changes?',
                        text: 'Any unsaved changes will be lost',
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, discard',
                        cancelButtonText: 'No, keep editing'
                      }).then((result) => {
                        if (result.isConfirmed) {
                          resetForm();
                        }
                      });
                    } else {
                      resetForm();
                    }
                  }}
                  className="mr-2 px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>{editingProduct ? "Update" : "Add"} Product</>
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

export default ProductManager;
