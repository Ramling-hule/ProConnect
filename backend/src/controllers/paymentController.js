import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import PaymentService from '../services/PaymentService.js';

export const createOrder = asyncHandler(async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const result = await PaymentService.createOrder(bookingId, req.user._id);
    res.json(result);
  } catch (err) {
    throw new AppError();
  }
});

export const verifyPayment = asyncHandler(async (req, res, next) => {
  try {
    const result = await PaymentService.verifyPayment(req.body);
    res.json({ message: 'Payment verified successfully', meetingLink: result.meetingLink });
  } catch (err) {
    throw new AppError();
  }
});

export const createGenericOrder = asyncHandler(async (req, res, next) => {
  const { type, entityId } = req.body;
  if (!type || !entityId) throw new AppError('Type and entityId are required', 400);
  
  const result = await PaymentService.createGenericOrder(type, entityId, req.user._id);
  res.json(result);
});

export const verifyGenericPayment = asyncHandler(async (req, res, next) => {
  const result = await PaymentService.verifyGenericPayment(req.body);
  res.json({ message: 'Payment verified successfully', ...result });
});
