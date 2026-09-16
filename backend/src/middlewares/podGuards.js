import AppError from '../utils/AppError.js';
import Pod from '../models/Pod.js';
import PodMember from '../models/PodMember.js';

export const requirePodMentor = async (req, res, next) => {
  try {
    const podId = req.params.id;
    if (!podId) return next(new AppError('Pod ID is required', 400));

    const pod = await Pod.findById(podId);
    if (!pod) return next(new AppError('Pod not found', 404));

    if (req.user.role === 'admin') {
      req.pod = pod;
      return next();
    }
    if (pod.mentorId.toString() === req.user._id.toString()) {
      req.pod = pod;
      return next();
    }
    const podMember = await PodMember.findOne({
      podId: pod._id,
      userId: req.user._id,
      status: 'ACTIVE'
    });

    if (podMember && (podMember.role === 'PRIMARY_MENTOR' || podMember.role === 'GUEST_MENTOR')) {
      req.pod = pod;
      return next();
    }

    return next(new AppError('Not authorized — you are not a mentor for this pod', 403));
  } catch (err) {
    next(err);
  }
};
