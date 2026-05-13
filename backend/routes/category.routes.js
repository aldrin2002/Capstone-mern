import express from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  renameCategory,
} from "../controllers/category.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Public (used by UI to populate dropdowns)
router.get("/", getAllCategories);

// Protected (admin)
router.post("/", verifyToken, createCategory);
router.put("/:id", verifyToken, renameCategory);
router.delete("/:id", verifyToken, deleteCategory);

export default router;
