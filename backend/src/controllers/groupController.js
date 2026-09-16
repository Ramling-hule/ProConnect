import Group from '../models/Group.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import cloudinary from '../config/cloudinary.js';
import notificationManager from '../services/notificationService.js';
import CacheService from '../services/CacheService.js';
import { env } from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
const TTL = {
  groupsList:    120,
  group:        1800,
  groupRequests: 300,
  groupMessages:  60,
};

const formatUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('https')) return url;
  return `${env.baseUrl}/${url}`;
};
export const createGroup = asyncHandler(async (req, res, next) => {
  const { name, description, privacy, memberLimit } = req.body;
  const creatorId = req.user._id;
  let imageUrl = '';

  if (req.file) {
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'proconnect_groups' },
        (error, result) =>
          error ? reject(new AppError('Failed to upload group image', 500)) : resolve(result),
      );
      stream.end(req.file.buffer);
    });
    imageUrl = uploadResult.secure_url;
  }

  let institute = null;
  if (privacy === 'private') {
    const user = await User.findById(creatorId);
    institute = user.institute;
  }

  const newGroup = await Group.create({
    name, description, privacy, institute,
    memberLimit: memberLimit || 50,
    admins: [creatorId], members: [creatorId],
    image: imageUrl,
    inviteCode: uuidv4().slice(0, 8),
  });

  await newGroup.populate('admins', 'name profilePicture');

  const formattedGroup = {
    ...newGroup.toObject(),
    image: formatUrl(newGroup.image),
    admins: newGroup.admins.map((a) => ({ ...a.toObject(), profilePicture: formatUrl(a.profilePicture) })),
  };

  await CacheService.del(`groups:list:${creatorId}`);
  res.status(201).json(formattedGroup);
});
export const getGroups = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const cacheKey = `groups:list:${userId}`;

  const cached = await CacheService.get(cacheKey);
  if (cached) return res.json(cached);

  const user = await User.findById(userId);

  const groups = await Group.find({
    $or: [
      { privacy: 'public' },
      { privacy: 'private', institute: user.institute },
      { members: userId },
    ],
  })
    .populate('admins', 'name profilePicture')
    .sort({ createdAt: -1 });

  const formattedGroups = groups.map((g) => {
    const isAdmin = g.admins.some((admin) => admin._id.toString() === userId.toString());
    return {
      ...g.toObject(),
      image: formatUrl(g.image),
      isMember: g.members.includes(userId),
      isAdmin,
      admins: g.admins.map((a) => ({ ...a.toObject(), profilePicture: formatUrl(a.profilePicture) })),
    };
  });

  await CacheService.set(cacheKey, formattedGroups, TTL.groupsList);
  res.json(formattedGroups);
});
export const getGroupById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const group = await Group.findById(id)
    .populate('joinRequests', 'name profilePicture instituteName headline')
    .populate('admins', 'name profilePicture')
    .populate('members', 'name profilePicture instituteName');

  if (!group) throw new AppError();

  await CacheService.set(`group:${id}`, group, TTL.group);
  res.status(200).json(group);
});
export const requestToJoinGroup = asyncHandler(async (req, res, next) => {
  const { groupId } = req.body;
  const requesterId = req.user._id;

  const group = await Group.findById(groupId);
  if (!group) throw new AppError();

  if (group.members.includes(requesterId) || group.admins.includes(requesterId)) {
    throw new AppError();
  }

  if (group.joinRequests?.includes(requesterId)) {
    throw new AppError();
  }

  group.joinRequests.push(requesterId);
  await group.save();

  await CacheService.del(`group:${groupId}`, `group_requests:${groupId}`);

  const io = req.app.get('io');
  await Promise.all(
    group.admins.map((adminId) =>
      notificationManager.notify({
        recipientId: adminId,
        senderId: requesterId,
        type: 'GROUP_JOIN_REQUEST',
        relatedId: group._id,
        message: `${req.user.name} requested to join "${group.name}"`,
      }, io),
    ),
  );

  res.status(200).json({ message: 'Request sent successfully', groupId: group._id });
});

export const handleJoinRequest = asyncHandler(async (req, res, next) => {
  const { groupId, requesterId, action } = req.body;
  const adminId = req.user._id;

  const group = await Group.findById(groupId);
  if (!group) throw new AppError();
  if (!group.admins.includes(adminId)) throw new AppError();
  if (!group.joinRequests.includes(requesterId)) {
    throw new AppError();
  }

  if (action === 'accept') {
    if (group.members.length >= (group.memberLimit || 50)) {
      throw new AppError();
    }
    if (!group.members.includes(requesterId)) group.members.push(requesterId);

    const io = req.app.get('io');
    await notificationManager.notify({
      recipientId: requesterId,
      senderId: adminId,
      type: 'GROUP_APPROVED',
      relatedId: group._id,
      message: `Your request to join "${group.name}" was approved!`,
    }, io);

    await CacheService.del(`groups:list:${requesterId}`);
  }

  group.joinRequests = group.joinRequests.filter((id) => id.toString() !== requesterId.toString());
  await group.save();

  await CacheService.del(`group:${groupId}`, `group_requests:${groupId}`);
  res.status(200).json({ message: `Request ${action}ed successfully` });
});

export const getGroupRequests = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;
  const userId = req.user._id;
  const cacheKey = `group_requests:${groupId}`;

  const cached = await CacheService.get(cacheKey);
  if (cached) return res.status(200).json(cached);

  const group = await Group.findById(groupId);
  if (!group) throw new AppError();
  if (!group.admins.includes(userId)) throw new AppError();

  await group.populate({ path: 'joinRequests', select: 'name profilePicture instituteName headline' });

  await CacheService.set(cacheKey, group.joinRequests, TTL.groupRequests);
  res.status(200).json(group.joinRequests);
});
export const joinGroup = asyncHandler(async (req, res, next) => {
  const { groupId } = req.body;
  const userId = req.user._id;

  const group = await Group.findById(groupId);
  if (!group) throw new AppError();

  if (group.members.includes(userId)) {
    throw new AppError();
  }

  if (group.members.length >= (group.memberLimit || 50)) {
    throw new AppError();
  }

  group.members.push(userId);
  await group.save();

  await CacheService.del(`group:${groupId}`, `groups:list:${userId}`);
  res.json({ success: true, message: 'Joined successfully' });
});
export const getGroupMessages = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;
  const cacheKey = `group_messages:${groupId}`;

  const cached = await CacheService.get(cacheKey);
  if (cached) return res.json(cached);

  const messages = await Message.find({ group: groupId })
    .populate('sender', 'name profilePicture')
    .sort({ createdAt: 1 });

  const formattedMessages = messages.map((m) => ({
    ...m.toObject(),
    sender: { ...m.sender.toObject(), profilePicture: formatUrl(m.sender.profilePicture) },
  }));

  await CacheService.set(cacheKey, formattedMessages, TTL.groupMessages);
  res.json(formattedMessages);
});
export const getGroupMedia = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;

  const mediaMessages = await Message.find({ group: groupId, fileUrl: { $ne: '' } })
    .populate('sender', 'name')
    .select('fileUrl fileType fileName createdAt sender')
    .sort({ createdAt: -1 });

  res.json(mediaMessages);
});
export const deleteGroup = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;
  const userId = req.user._id;

  const group = await Group.findById(groupId);
  if (!group) throw new AppError();
  if (!group.admins.includes(userId)) {
    throw new AppError();
  }

  await Message.deleteMany({ group: groupId });
  await Notification.deleteMany({ relatedId: groupId });
  await Group.findByIdAndDelete(groupId);

  await CacheService.del(
    `group:${groupId}`,
    `group_messages:${groupId}`,
    `group_requests:${groupId}`,
    `groups:list:${userId}`,
  );

  res.json({ message: 'Group deleted successfully' });
});