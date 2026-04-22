import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.MODE === "development"
    ? "http://localhost:5000/api/products"
    : "/api/products";

export const useProductManager = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    inStock: 0,
    outOfStock: 0,
    totalValue: 0
  });

  const { user } = useAuthStore();

  const calculateStats = () => {
    const total = products.length;
    const inStock = products.filter(p => p.stock > 0).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    
    setStats({ total, inStock, outOfStock, totalValue });
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL, {
        headers: getAuthHeaders()
      });

      // Single summary log for all products
      console.log(
        "[Product Manager] Product Summary:",
        response.data.map((product, index) => ({
          "#": index + 1,
          name: product.name,
          image: product.image,
          imagePublicId: product.imagePublicId,
          isCloudinary: product.image?.includes('cloudinary.com'),
          urlValid: !!product.image
        }))
      );

      setProducts(response.data);
    } catch (error) {
      console.error("❌ Error fetching products:", error);
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

  const createProduct = async (productData) => {
    setIsLoading(true);
    try {
      console.log("📤 Creating product with data:");
      
      // Enhanced FormData logging
      for (let [key, value] of productData.entries()) {
        if (key === 'image') {
          console.log(`${key}:`, value ? `File: ${value.name}, Size: ${value.size}, Type: ${value.type}` : 'No file');
        } else {
          console.log(`${key}:`, value);
        }
      }

      const response = await axios.post(API_URL, productData, { 
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log("✅ Product created:", response.data);
      console.log("New product image URL:", response.data.image);

      Swal.fire({
        icon: 'success',
        title: 'Added!',
        text: 'Product added successfully',
        timer: 1500,
        showConfirmButton: false
      });
      
      // Refresh products to ensure we get the latest data with correct image URLs
      await fetchProducts();
    } catch (error) {
      console.error("❌ Error creating product:", error);
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

  const updateProduct = async (id, productData) => {
    setIsLoading(true);
    try {
      console.log("📝 Updating product:", id);
      
      // Enhanced FormData logging
      for (let [key, value] of productData.entries()) {
        if (key === 'image') {
          console.log(`${key}:`, value ? `File: ${value.name}, Size: ${value.size}, Type: ${value.type}` : 'No new file');
        } else {
          console.log(`${key}:`, value);
        }
      }

      const response = await axios.put(`${API_URL}/${id}`, productData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log("✅ Product updated:", response.data);
      console.log("Updated product image URL:", response.data.image);

      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Product updated successfully',
        timer: 1500,
        showConfirmButton: false
      });
      
      // Refresh products to ensure we get the latest data with correct image URLs
      await fetchProducts();
    } catch (error) {
      console.error("❌ Error updating product:", error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || "Failed to update product",
        confirmButtonColor: '#3085d6',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const bulkUpdateProductStocks = async (productUpdates) => {
    if (!Array.isArray(productUpdates) || productUpdates.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Products Selected',
        text: 'Please select products to update.',
        confirmButtonColor: '#3085d6',
      });
      return false;
    }

    setIsLoading(true);
    try {
      const results = await Promise.allSettled(
        productUpdates.map(({ id, stock }) => {
          const updateData = new FormData();
          updateData.append('stock', String(stock));

          return axios.put(`${API_URL}/${id}`, updateData, {
            headers: {
              ...getAuthHeaders(),
              'Content-Type': 'multipart/form-data'
            }
          });
        })
      );

      const failed = results.filter((result) => result.status === 'rejected');
      const successCount = results.length - failed.length;

      await fetchProducts();

      if (failed.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Bulk Update Partially Completed',
          text: `${successCount} product(s) updated, ${failed.length} failed.`,
          confirmButtonColor: '#3085d6',
        });
        return false;
      }

      Swal.fire({
        icon: 'success',
        title: 'Bulk Update Complete',
        text: `${successCount} product(s) updated successfully.`,
        timer: 1700,
        showConfirmButton: false,
      });
      return true;
    } catch (error) {
      console.error('❌ Error in bulk stock update:', error);
      Swal.fire({
        icon: 'error',
        title: 'Bulk Update Failed',
        text: error.response?.data?.message || 'Failed to update selected product quantities.',
        confirmButtonColor: '#3085d6',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id, productName) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirm Deletion',
      html: `Are you sure you want to delete <strong>${productName}</strong>?<br><span class="text-red-600 text-sm">This action cannot be undone!</span>`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    
    if (!result.isConfirmed) {
      return;
    }
    
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
      console.log("🗑️ Deleting product:", id);
      
      await axios.delete(`${API_URL}/${id}`, { 
        headers: getAuthHeaders()
      });

      console.log("✅ Product deleted successfully");

      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Product deleted successfully',
        timer: 1500,
        showConfirmButton: false
      });
      
      // Refresh products to ensure we get the latest data
      await fetchProducts();
    } catch (error) {
      console.error("❌ Error deleting product:", error);
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

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [products]);

  return {
    products,
    isLoading,
    stats,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkUpdateProductStocks
  };
};