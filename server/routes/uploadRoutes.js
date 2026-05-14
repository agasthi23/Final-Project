// server/routes/uploadRoutes.js
import express from 'express';
import { extractBillFromFile, upload } from '../controllers/ocrController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Use 'protect' instead of 'auth'
router.post('/extract-bill', protect, upload.single('file'), extractBillFromFile);

export default router;