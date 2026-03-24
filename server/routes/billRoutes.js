// server/routes/billRoutes.js
import express from "express";
import { getBills, createBill, updateBill, deleteBill } from "../controllers/billController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // all bill routes require login

router.get("/",        getBills);
router.post("/",       createBill);
router.put("/:id",     updateBill);
router.delete("/:id",  deleteBill);

export default router;