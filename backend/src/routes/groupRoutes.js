import express from 'express';
import multer from 'multer';
import { protect } from '../middlewares/authMiddleware.js';
import {
    createGroup,
    getGroups,
    getGroupById,
    requestToJoinGroup,
    handleJoinRequest,
    getGroupRequests,
    joinGroup,
    getGroupMessages,
    getGroupMedia,
    deleteGroup
} from '../controllers/groupController.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
router.post('/', protect, upload.single('image'), createGroup);
router.get('/', protect, getGroups);
router.post('/join', protect, requestToJoinGroup);
router.post('/request-join', protect, requestToJoinGroup);
router.post('/join-public', protect, joinGroup);
router.post('/handle-request', protect, handleJoinRequest);
router.get('/:id', protect, getGroupById);
router.get('/:groupId/requests', protect, getGroupRequests);
router.get('/:groupId/messages', protect, getGroupMessages);
router.get('/:groupId/media', protect, getGroupMedia);
router.delete('/:groupId', protect, deleteGroup);

export default router;
