import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";

const normalizeName = (name) => {
  if (typeof name !== "string") return "";
  return name.trim();
};

export const getAllCategories = async (req, res) => {
  try {
    let categories = await Category.find().sort({ name: 1 });

    // Seed defaults if none exist yet (keeps UI usable out-of-the-box)
    if (categories.length === 0) {
      const defaults = ["Coffee", "Tea", "Pastry", "Sandwich", "Dessert", "Other"];
      try {
        await Category.insertMany(defaults.map((name) => ({ name })), { ordered: false });
      } catch {
        // Ignore duplicate insert errors in case of races
      }
      categories = await Category.find().sort({ name: 1 });
    }

    return res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ message: "Error fetching categories" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const name = normalizeName(req.body?.name);
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: "Category already exists" });
    }

    const category = await Category.create({ name });

    return res.status(201).json({
      success: true,
      message: "Category created",
      category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({ message: "Error creating category" });
  }
};

export const renameCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const newName = normalizeName(req.body?.name);

    if (!newName) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (category.name === newName) {
      return res.status(200).json({
        success: true,
        message: "No changes",
        category,
      });
    }

    const existing = await Category.findOne({ name: newName });
    if (existing) {
      return res.status(409).json({ message: "Category name already exists" });
    }

    const oldName = category.name;
    category.name = newName;
    await category.save();

    // Keep products consistent by updating their category string.
    await Product.updateMany({ category: oldName }, { $set: { category: newName } });

    return res.status(200).json({
      success: true,
      message: "Category renamed",
      category,
    });
  } catch (error) {
    console.error("Error renaming category:", error);
    return res.status(500).json({ message: "Error renaming category" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const inUse = await Product.exists({ category: category.name });
    if (inUse) {
      return res.status(409).json({
        message: "Cannot delete a category that is used by products",
      });
    }

    await Category.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Category deleted",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ message: "Error deleting category" });
  }
};
