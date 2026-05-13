import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { X, Loader, Plus, Settings, Trash2, Save } from 'lucide-react';
import Swal from 'sweetalert2';

const CATEGORIES_API_URL = import.meta.env.MODE === "development"
  ? "http://localhost:5000/api/categories"
  : "/api/categories";

const ProductModal = ({
  showModal,
  editingProduct,
  formData,
  setFormData,
  imagePreview,
  setImagePreview,
  onSubmit,
  onClose,
  isLoading
}) => {
  const [categories, setCategories] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [categoryEdits, setCategoryEdits] = useState({});

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchCategories = async () => {
    setIsCategoriesLoading(true);
    try {
      const res = await axios.get(CATEGORIES_API_URL);
      const list = Array.isArray(res.data) ? res.data : [];
      setCategories(list);

      // If the form has no category selected, pick the first.
      if (!formData.category && list.length > 0) {
        setFormData((prev) => ({ ...prev, category: list[0].name }));
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (!showModal) return;
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  // Keep a fallback option so editing an old product doesn't break
  // if its category doesn't exist anymore.
  const categoryOptions = useMemo(() => {
    const names = categories.map((c) => c.name);
    const options = [...names];
    if (formData.category && !names.includes(formData.category)) {
      options.unshift(formData.category);
    }
    return options;
  }, [categories, formData.category]);

  const createCategoryByName = async (rawName) => {
    const name = (rawName || '').trim();
    if (!name) return false;

    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      Swal.fire({
        icon: 'error',
        title: 'Not Authenticated',
        text: 'Please login again to add categories.',
        confirmButtonColor: '#F13E93',
      });
      return false;
    }

    try {
      const res = await axios.post(
        CATEGORIES_API_URL,
        { name },
        { headers }
      );

      const created = res.data?.category;
      if (!created?.name) {
        throw new Error('Invalid response from server');
      }

      setCategories((prev) => {
        const exists = prev.some((c) => c._id === created._id || c.name === created.name);
        const next = exists ? prev : [...prev, created];
        return next.slice().sort((a, b) => a.name.localeCompare(b.name));
      });
      setFormData((prev) => ({ ...prev, category: created.name }));

      return true;
    } catch (error) {
      if (error.response?.status === 409) {
        // Already exists: refresh list and select best match.
        await fetchCategories();
        const match = (categories || []).find(
          (c) => (c.name || '').toLowerCase() === name.toLowerCase()
        );
        setFormData((prev) => ({ ...prev, category: match?.name || name }));
        return true;
      }

      const message = error.response?.data?.message || 'Failed to add category';
      Swal.fire({
        icon: 'error',
        title: 'Add Category Failed',
        text: message,
        confirmButtonColor: '#F13E93',
      });
      return false;
    }
  };

  const handleOpenAddCategory = async () => {
    const result = await Swal.fire({
      title: 'Add Category',
      input: 'text',
      inputPlaceholder: 'Enter category name',
      showCancelButton: true,
      confirmButtonText: 'Add',
      confirmButtonColor: '#F13E93',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value || !value.trim()) return 'Category name is required';
        return null;
      },
    });

    if (!result.isConfirmed) return;
    await createCategoryByName(result.value);
  };

  const openManageCategories = () => {
    const edits = {};
    categories.forEach((c) => {
      edits[c._id] = c.name;
    });
    setCategoryEdits(edits);
    setIsManageCategoriesOpen(true);
  };

  const handleRenameCategory = async (categoryId, oldName) => {
    const name = (categoryEdits[categoryId] || '').trim();
    if (!name) return;

    try {
      const res = await axios.put(
        `${CATEGORIES_API_URL}/${categoryId}`,
        { name },
        { headers: getAuthHeaders() }
      );

      const updated = res.data?.category;
      if (!updated?._id) {
        throw new Error('Invalid response from server');
      }

      setCategories((prev) =>
        prev
          .map((c) => (c._id === updated._id ? updated : c))
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      if (formData.category && oldName && formData.category === oldName) {
        setFormData((prev) => ({ ...prev, category: updated.name }));
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to rename category';
      Swal.fire({
        icon: 'error',
        title: 'Rename Failed',
        text: message,
        confirmButtonColor: '#F13E93',
      });
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const category = categories.find((c) => c._id === categoryId);
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Category?',
      text: category?.name ? `Delete “${category.name}”?` : 'Delete this category?',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#F13E93',
      confirmButtonText: 'Delete',
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${CATEGORIES_API_URL}/${categoryId}`, {
        headers: getAuthHeaders(),
      });

      setCategories((prev) => prev.filter((c) => c._id !== categoryId));

      // If the currently selected category was deleted, pick the first available.
      if (formData.category && category?.name && formData.category === category.name) {
        const remaining = categories.filter((c) => c._id !== categoryId);
        setFormData((prev) => ({ ...prev, category: remaining[0]?.name || '' }));
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete category';
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: message,
        confirmButtonColor: '#F13E93',
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      const file = files[0];
      
      if (file && file.size > 50 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Image must be less than 50MB',
          confirmButtonColor: '#F13E93',
        });
        e.target.value = null;
        return;
      }
      
      console.log("📁 File selected:", file);
      
      setFormData({
        ...formData,
        [name]: file,
      });

      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log("📷 Image preview set");
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

  const handleClose = () => {
    const hasChanges = formData.name || formData.price || formData.description || formData.image;
    
    if (hasChanges) {
      Swal.fire({
        title: 'Discard Changes?',
        text: 'Any unsaved changes will be lost',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#F13E93',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, discard',
        cancelButtonText: 'No, keep editing'
      }).then((result) => {
        if (result.isConfirmed) {
          onClose();
        }
      });
    } else {
      onClose();
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-brand to-primary-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h3>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          <form onSubmit={onSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                required
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Price (₱)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                required
                placeholder="0.00"
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
                required
                placeholder="Describe your product"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Category
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenAddCategory}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-primary-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span> Add</span>
                    </button>
                    <button
                      type="button"
                      onClick={openManageCategories}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-primary-700 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                  required
                  disabled={isCategoriesLoading}
                >
                  {isCategoriesLoading && (
                    <option value="">Loading...</option>
                  )}

                  {!isCategoriesLoading && categoryOptions.length === 0 && (
                    <option value="">No categories yet</option>
                  )}

                  {!isCategoriesLoading && categoryOptions.map((name) => (
                    <option key={name} value={name}>
                      {name === 'Tea' ? 'Milk Tea' : name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                  required
                  placeholder="0"
                />
              </div>
            </div>

            {isManageCategoriesOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-brand to-primary-700 p-5 text-white flex items-center justify-between">
                    <h4 className="text-lg font-bold">Edit Categories</h4>
                    <button
                      type="button"
                      onClick={() => setIsManageCategoriesOpen(false)}
                      className="text-white hover:text-gray-200 transition-colors"
                      aria-label="Close"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
                    {categories.length === 0 ? (
                      <p className="text-sm text-gray-600">No categories yet.</p>
                    ) : (
                      categories.map((c) => (
                        <div key={c._id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={categoryEdits[c._id] ?? c.name}
                            onChange={(e) =>
                              setCategoryEdits((prev) => ({ ...prev, [c._id]: e.target.value }))
                            }
                            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameCategory(c._id, c.name)}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white border-2 border-gray-200 hover:border-brand hover:text-brand transition-all"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c._id)}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white border-2 border-gray-200 hover:border-red-500 hover:text-red-600 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-5 pb-5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsManageCategoriesOpen(false)}
                      className="px-6 py-2 bg-gradient-to-r from-brand to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold transition-all duration-300"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Product Image
              </label>
              <input
                type="file"
                name="image"
                onChange={handleChange}
                accept="image/*"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
                required={!editingProduct}
              />
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-4 relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-32 w-full object-cover rounded-xl"
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
              
              {editingProduct && !formData.image && !imagePreview && (
                <p className="text-sm text-gray-500 mt-2">
                  Leave empty to keep the current image
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
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
                    <span>{editingProduct ? "Update" : "Add"} Product</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;