import React, { useState, useEffect } from "react";
import { Plus, Package, Boxes, CheckSquare, Square } from "lucide-react";
import Swal from "sweetalert2";

// Components
import ProductStats from "./ProductManager/ProductStats";
import SearchAndFilter from "./ProductManager/SearchAndFilter";
import ProductCard from "./ProductManager/ProductCard";
import ProductModal from "./ProductManager/ProductModal";

// Custom Hook
import { useProductManager } from "../../hooks/useProductManager";

const ProductManager = () => {
  const {
    products,
    isLoading,
    stats,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkUpdateProductStocks
  } = useProductManager();

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("set");
  const [bulkValue, setBulkValue] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "Coffee",
    stock: "0",
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);

  const categories = ["All", "Coffee", "Tea", "Pastry", "Sandwich", "Dessert", "Other"];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const existingIds = new Set(products.map((product) => product._id));
    setSelectedProductIds((prev) => prev.filter((id) => existingIds.has(id)));
  }, [products]);

  // Remove or comment out all console.log except for errors and one summary
  const validateImageFile = (file) => {
    if (!file) {
      console.error("Image validation failed: No file provided");
      return { isValid: false, error: "No file provided" };
    }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      console.error("Image validation failed: Invalid file type", file.type);
      return { isValid: false, error: `Invalid file type: ${file.type}` };
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error("Image validation failed: File too large", file.size);
      return { isValid: false, error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 10MB` };
    }
    return { isValid: true, error: null };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      console.error("❌ Validation failed: Name is required");
      Swal.fire({
        icon: 'warning',
        title: 'Name Required',
        text: 'Please enter a product name',
        confirmButtonColor: '#F13E93',
      });
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      console.error("❌ Validation failed: Invalid price", {
        provided: formData.price,
        parsed: parseFloat(formData.price)
      });
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Price',
        text: 'Please enter a valid price greater than zero',
        confirmButtonColor: '#F13E93',
      });
      return;
    }
    
    // Enhanced image validation for new products
    if (!editingProduct && !formData.image) {
      console.error("❌ Image validation failed: No image provided for new product");
      Swal.fire({
        icon: 'warning',
        title: 'Image Required',
        text: 'Please select an image for the product',
        confirmButtonColor: '#F13E93',
      });
      return;
    }

    // Validate image file if provided
    if (formData.image) {
      const validation = validateImageFile(formData.image);
      if (!validation.isValid) {
        console.error("❌ Image validation failed:", validation.error);
        Swal.fire({
          icon: 'error',
          title: 'Invalid Image',
          text: validation.error,
          confirmButtonColor: '#F13E93',
        });
        return;
      }
    }
    
    Swal.fire({
      title: 'Processing...',
      html: 'Please wait while we save your changes',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    console.log("📤 Creating FormData for submission");
    const productData = new FormData();
    productData.append("name", formData.name);
    productData.append("price", formData.price);
    productData.append("description", formData.description);
    productData.append("category", formData.category);
    productData.append("stock", formData.stock);
    
    if (formData.image) {
      console.log("📎 Appending image to FormData:", {
        fileName: formData.image.name,
        fileSize: formData.image.size,
        fileType: formData.image.type
      });
      productData.append("image", formData.image);
    } else {
      console.log("ℹ️ No image file to append (editing existing product without image change)");
    }

    // Log FormData contents
    console.log("📋 FormData contents:");
    for (let [key, value] of productData.entries()) {
      if (key === 'image') {
        console.log(`${key}:`, value instanceof File ? {
          name: value.name,
          size: value.size,
          type: value.type
        } : value);
      } else {
        console.log(`${key}:`, value);
      }
    }

    try {
      if (editingProduct) {
        console.log("🔄 Updating existing product:", editingProduct._id);
        await updateProduct(editingProduct._id, productData);
      } else {
        console.log("➕ Creating new product");
        await createProduct(productData);
      }
      console.log("✅ Product operation completed successfully");
    } catch (error) {
      console.error("❌ Error during product operation:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
    }
    
    resetForm();
  };

  const resetForm = () => {
    console.log("🔄 Resetting form");
    console.log("Previous form state:", {
      name: formData.name,
      hasImage: !!formData.image,
      imagePreview: !!imagePreview,
      wasEditing: !!editingProduct
    });
    
    setFormData({
      name: "",
      price: "",
      description: "",
      category: "Coffee",
      stock: "0",
      image: null,
    });
    setImagePreview(null);
    setEditingProduct(null);
    setShowModal(false);
    
    console.log("✅ Form reset completed");
  };

  const handleEdit = (product) => {
    console.log("✏️ Editing product:", {
      id: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      hasImage: !!product.image,
      imageUrl: product.image,
      imagePublicId: product.imagePublicId
    });
    
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      category: product.category,
      stock: product.stock.toString(),
      image: null, // Don't set the image file, only for new uploads
    });
    
    // Enhanced image preview handling with error checking
    if (product.image) {
      console.log("🖼️ Setting image preview from existing product image:", product.image);
      
      // Validate the image URL
      if (product.image.includes('cloudinary.com')) {
        console.log("✅ Valid Cloudinary URL detected");
        setImagePreview(product.image);
      } else if (product.image.startsWith('data:image/')) {
        console.log("✅ Valid data URL detected");
        setImagePreview(product.image);
      } else if (product.image.startsWith('/uploads/') || product.image.startsWith('http')) {
        console.log("✅ Valid file path/URL detected");
        setImagePreview(product.image);
      } else {
        console.error("❌ Invalid image URL format:", product.image);
        setImagePreview(null);
      }
    } else {
      console.log("ℹ️ No image found for product");
      setImagePreview(null);
    }
    
    setShowModal(true);
    console.log("✅ Edit mode setup completed");
  };

  // Enhanced filtering with console logging
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const clearBulkSelection = () => {
    setSelectedProductIds([]);
    setBulkValue("");
    setBulkAction("set");
  };

  const toggleBulkMode = () => {
    setBulkMode((prev) => {
      const next = !prev;
      if (!next) {
        clearBulkSelection();
      }
      return next;
    });
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredProducts.map((product) => product._id);
    const selectedInFiltered = filteredIds.filter((id) => selectedProductIds.includes(id));

    if (selectedInFiltered.length === filteredIds.length && filteredIds.length > 0) {
      setSelectedProductIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
      return;
    }

    setSelectedProductIds((prev) => {
      const merged = new Set([...prev, ...filteredIds]);
      return Array.from(merged);
    });
  };

  const handleBulkUpdate = async () => {
    if (selectedProductIds.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Products Selected",
        text: "Select at least one product to update quantity.",
        confirmButtonColor: "#F13E93",
      });
      return;
    }

    const parsedValue = Number(bulkValue);
    const isInvalidValue = Number.isNaN(parsedValue) || parsedValue < 0;
    const isZeroChange = (bulkAction === "increase" || bulkAction === "decrease") && parsedValue === 0;

    if (isInvalidValue || isZeroChange) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Quantity",
        text: bulkAction === "set"
          ? "Set quantity must be 0 or greater."
          : "Adjustment quantity must be greater than 0.",
        confirmButtonColor: "#F13E93",
      });
      return;
    }

    const selectedProducts = products.filter((product) => selectedProductIds.includes(product._id));
    const updates = selectedProducts
      .map((product) => {
        let nextStock = product.stock;

        if (bulkAction === "set") {
          nextStock = parsedValue;
        }
        if (bulkAction === "increase") {
          nextStock = product.stock + parsedValue;
        }
        if (bulkAction === "decrease") {
          nextStock = Math.max(0, product.stock - parsedValue);
        }

        return { id: product._id, stock: nextStock };
      })
      .filter((update) => {
        const original = selectedProducts.find((product) => product._id === update.id);
        return original && original.stock !== update.stock;
      });

    if (updates.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Changes Needed",
        text: "Selected products already have the target quantity.",
        confirmButtonColor: "#F13E93",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "Confirm Bulk Quantity Update",
      html: `Apply <strong>${bulkAction}</strong> with value <strong>${parsedValue}</strong> to <strong>${updates.length}</strong> product(s)?`,
      showCancelButton: true,
      confirmButtonColor: "#F13E93",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update quantities",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    const success = await bulkUpdateProductStocks(updates);
    if (success) {
      clearBulkSelection();
      setBulkMode(false);
    }
  };

  // Log product image status on component load
  useEffect(() => {
    if (products.length > 0) {
      console.log("📊 Product Manager Image Status Report:");
      const imageStats = {
        total: products.length,
        withImages: 0,
        withCloudinaryImages: 0,
        withLocalImages: 0,
        withoutImages: 0,
        withInvalidImages: 0
      };

      products.forEach((product, index) => {
        const hasImage = !!product.image;
        const isCloudinary = product.image?.includes('cloudinary.com');
        const isLocal = product.image?.startsWith('/uploads/') || product.image?.startsWith('http');
        const isDataUrl = product.image?.startsWith('data:image/');
        
        console.log(`Product ${index + 1}: ${product.name}`, {
          hasImage,
          imageUrl: product.image || 'N/A',
          isCloudinary,
          isLocal,
          isDataUrl,
          publicId: product.imagePublicId || 'N/A'
        });

        if (hasImage) {
          imageStats.withImages++;
          if (isCloudinary) {
            imageStats.withCloudinaryImages++;
          } else if (isLocal || isDataUrl) {
            imageStats.withLocalImages++;
          } else {
            imageStats.withInvalidImages++;
            console.warn(`⚠️ Product "${product.name}" has invalid image URL:`, product.image);
          }
        } else {
          imageStats.withoutImages++;
        }
      });

      console.log("📈 Image Statistics:", imageStats);
      
      if (imageStats.withInvalidImages > 0) {
        console.error(`❌ Found ${imageStats.withInvalidImages} products with invalid image URLs`);
      }
    }
  }, [products]);

  if (isLoading && !showModal && products.length === 0) {
    return (
      <div className="p-6 h-full flex justify-center items-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-brand rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-brand rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading products...</p>
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
            Product Management
          </h2>
          <p className="text-gray-600 mt-1">Manage your cafe menu items</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={toggleBulkMode}
            className={`px-6 py-3 rounded-2xl flex items-center justify-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
              bulkMode
                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                : "bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white"
            }`}
          >
            <Boxes className="h-5 w-5" />
            <span className="font-medium">{bulkMode ? "Cancel Bulk" : "Bulk Update Qty"}</span>
          </button>

          <button
            onClick={() => {
              console.log("➕ Add Product button clicked");
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-brand to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-2xl flex items-center justify-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Add Product</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <ProductStats stats={stats} />

      {/* Search and Filters */}
      <SearchAndFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        viewMode={viewMode}
        setViewMode={setViewMode}
        categories={categories}
      />

      {bulkMode && (
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-primary-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Bulk Quantity Update</h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedProductIds.length} selected from {filteredProducts.length} filtered product(s)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggleSelectAllFiltered}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300 flex items-center gap-2"
              >
                {filteredProducts.length > 0 && filteredProducts.every((product) => selectedProductIds.includes(product._id)) ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span>Select Filtered</span>
              </button>

              <button
                onClick={clearBulkSelection}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
            >
              <option value="set">Set quantity to</option>
              <option value="increase">Increase by</option>
              <option value="decrease">Decrease by</option>
            </select>

            <input
              type="number"
              min="0"
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
              placeholder="Enter quantity"
            />

            <button
              onClick={handleBulkUpdate}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-medium transition-all duration-300"
            >
              Apply Bulk Update
            </button>
          </div>
        </div>
      )}

      {/* Products Display */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl font-medium text-gray-500">No products found</p>
          <p className="text-gray-400 mt-2">Try adjusting your search criteria or add some products</p>
        </div>
      ) : (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
        }>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              viewMode={viewMode}
              onEdit={handleEdit}
              onDelete={deleteProduct}
              bulkMode={bulkMode}
              isSelected={selectedProductIds.includes(product._id)}
              onToggleSelect={toggleProductSelection}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ProductModal
        showModal={showModal}
        editingProduct={editingProduct}
        formData={formData}
        setFormData={setFormData}
        imagePreview={imagePreview}
        setImagePreview={setImagePreview}
        onSubmit={handleSubmit}
        onClose={resetForm}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ProductManager;
