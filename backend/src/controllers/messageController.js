import mongoose from 'mongoose';
import MessageService from '../services/message.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

export const getDirectMessages = asyncHandler(async (req, res, next) => {
  const { userId, otherId } = req.params;
  const { cursor, limit = 50 } = req.query;
  if (req.user && req.user._id.toString() !== userId && req.user.role?.toLowerCase() !== 'admin') {
     throw new AppError('Unauthorized access to messages', 403);
  }

  const result = await MessageService.getDirectMessages(userId, otherId, cursor, limit);

  res.json({ 
    success: true, 
    ...result
  });
});

export const searchMessages = asyncHandler(async (req, res, next) => {
  const { userId, otherId } = req.params;
  const { q } = req.query;

  if (!q || q.trim() === '') {
    throw new AppError('Search query is required', 400);
  }
  if (req.user && req.user._id.toString() !== userId && req.user.role?.toLowerCase() !== 'admin') {
     throw new AppError('Unauthorized access to messages', 403);
  }
  
  const result = await MessageService.getDirectMessages(userId, otherId, null, 1000);
  
  const filteredMessages = result.data.filter(msg => 
    msg.text && msg.text.toLowerCase().includes(q.toLowerCase())
  );

  res.json({
    success: true,
    data: filteredMessages
  });
});