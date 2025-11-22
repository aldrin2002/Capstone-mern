import express from "express";
import { recordVisit, getVisitCount } from "../controllers/visit.controller.js";

const router = express.Router();

router.post("/record", recordVisit);
router.get("/count", getVisitCount);

export default router;