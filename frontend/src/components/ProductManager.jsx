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

const API_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000/api/products"
    : "/api/products";

// Add API base URL for images
const API_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "Coffee",
    stock: 0,
    image: null,
    featured: false,
  });

  const [imagePreview, setImagePreview] = useState(null);

  const categories = [
    "All",
    "Coffee",
    "Tea",
    "Pastry",
    "Sandwich",
    "Dessert",
    "Other",
  ];

  // Fetch all products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search and category
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === "All" || product.category === categoryFilter)
  );

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        [name]: file,
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

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      description: "",
      category: "Coffee",
      stock: 0,
      image: null,
      featured: false,
    });
    setImagePreview(null);
    setEditingProduct(null);
    setIsAddingProduct(false);
  };

  // Handle form submission for adding or updating product
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create FormData object for file upload
      const productData = new FormData();
      productData.append("name", formData.name);
      productData.append("price", formData.price);
      productData.append("description", formData.description);
      productData.append("category", formData.category);
      productData.append("stock", formData.stock.toString());

      // Only append file if it exists (for new products or when updating image)
      if (formData.image) {
        productData.append("image", formData.image);
      }

      if (editingProduct) {
        // Update existing product
        productData.append("featured", formData.featured);
        await axios.put(`${API_URL}/${editingProduct._id}`, productData, {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Product updated successfully");
      } else {
        // Add new product
        await axios.post(API_URL, productData, {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Product added successfully");
      }

      // Refresh products and reset form
      fetchProducts();
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(
        editingProduct ? "Failed to update product" : "Failed to add product"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle product edit
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || "",
      category: product.category,
      stock: product.stock || 0,
      image: null, // Don't set the file object, just leave it null
      featured: product.featured || false,
    });

    // Set image preview from the current product image
    setImagePreview(product.image ? `${API_BASE_URL}${product.image}` : null);

    setIsAddingProduct(true);
  };

  // Handle product delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-800">
          Products Management
        </h2>
        <button
          onClick={() => setIsAddingProduct(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={isLoading}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : (
        <>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="h-40 bg-gray-200 flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={`${API_BASE_URL}${product.image}`}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Coffee className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {product.name}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {product.category}
                        </span>
                      </div>
                      <div className="flex items-center text-green-600 font-semibold">
                        <span className="h-4 w-4 mr-1">₱</span>
                        {product.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-600">
                        Stock: {product.stock}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          className="p-1 text-blue-600 hover:text-blue-800"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          className="p-1 text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(product._id)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Product Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="name"
                >
                  Product Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="category"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories
                    .filter((category) => category !== "All")
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="price"
                >
                  Price
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="stock"
                >
                  Stock
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                ></textarea>
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="image"
                >
                  Product Image
                </label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={handleChange}
                  accept="image/*"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="h-32 object-contain border rounded"
                    />
                  </div>
                )}
                {editingProduct && !formData.image && (
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty to keep the current image
                  </p>
                )}
              </div>

              {editingProduct && (
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="featured"
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={formData.featured}
                      onChange={handleChange}
                    />
                    <span className="ml-2 text-gray-700">Featured product</span>
                  </label>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                  onClick={resetForm}
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
