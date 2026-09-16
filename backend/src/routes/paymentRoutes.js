import express from "express";
import { createOrder, verifyPayment, createGenericOrder, verifyGenericPayment } from "../controllers/paymentController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create-order", authenticate, createOrder);
router.post("/verify", authenticate, verifyPayment);

router.post("/generic/create-order", authenticate, createGenericOrder);
router.post("/generic/verify", authenticate, verifyGenericPayment);

export default router;
