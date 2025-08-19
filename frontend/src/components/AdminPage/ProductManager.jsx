import React, { useState, useEffect } from "react";
import { Plus, Package } from "lucide-react";
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
    deleteProduct
  } = useProductManager();

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState("grid");

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

  // Enhanced console logging for image validation
  const validateImageFile = (file) => {
    console.log("🔍 Validating image file:", {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      lastModified: file?.lastModified ? new Date(file.lastModified).toISOString() : 'N/A'
    });

    if (!file) {
      console.error("❌ Image validation failed: No file provided");
      return { isValid: false, error: "No file provided" };
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      console.error("❌ Image validation failed: Invalid file type", {
        provided: file.type,
        allowed: validTypes
      });
      return { isValid: false, error: `Invalid file type: ${file.type}. Allowed: ${validTypes.join(', ')}` };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error("❌ Image validation failed: File too large", {
        size: file.size,
        maxSize: maxSize,
        sizeInMB: (file.size / 1024 / 1024).toFixed(2)
      });
      return { isValid: false, error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 10MB` };
    }

    console.log("✅ Image validation passed");
    return { isValid: true, error: null };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("📝 Form submission started");
    console.log("Form data state:", {
      name: formData.name,
      price: formData.price,
      description: formData.description,
      category: formData.category,
      stock: formData.stock,
      hasImage: !!formData.image,
      imageFile: formData.image ? {
        name: formData.image.name,
        size: formData.image.size,
        type: formData.image.type
      } : null,
      isEditing: !!editingProduct,
      editingProductId: editingProduct?._id,
      currentImagePreview: imagePreview
    });
    
    if (!formData.name.trim()) {
      console.error("❌ Validation failed: Name is required");
      Swal.fire({
        icon: 'warning',
        title: 'Name Required',
        text: 'Please enter a product name',
        confirmButtonColor: '#3085d6',
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
        confirmButtonColor: '#3085d6',
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
        confirmButtonColor: '#3085d6',
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
          confirmButtonColor: '#3085d6',
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
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading products...</p>
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
            Product Management
          </h2>
          <p className="text-gray-600 mt-1">Manage your cafe menu items</p>
        </div>
        <button
          onClick={() => {
            console.log("➕ Add Product button clicked");
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-2xl flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">Add Product</span>
        </button>
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
