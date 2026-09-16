import AppError from '../utils/AppError.js';
import Pod from '../models/Pod.js';

class PodStateService {
  async autoStart(podId) {
    const pod = await Pod.findById(podId);
    if (!pod) return null;

    if (pod.status === 'FORMING' && pod.activeMemberCount >= pod.minSize) {
      pod.status = 'ACTIVE';
      pod.startedAt = new Date();
      await pod.save();
    }
    return pod;
  }

  async startPod(podId, mentorId) {
    const pod = await Pod.findById(podId);
    if (!pod) throw new AppError('Pod not found', 404);
    if (pod.mentorId.toString() !== mentorId.toString()) throw new AppError('Unauthorized', 403);
    
    if (pod.status !== 'FORMING') throw new AppError(`Cannot start a pod in ${pod.status} state`, 400);

    pod.status = 'ACTIVE';
    pod.startedAt = new Date();
    await pod.save();
    return pod;
  }

  async completePod(podId, mentorId) {
    const pod = await Pod.findById(podId);
    if (!pod) throw new AppError('Pod not found', 404);
    if (pod.mentorId.toString() !== mentorId.toString()) throw new AppError('Unauthorized', 403);

    if (pod.status !== 'ACTIVE') throw new AppError(`Cannot complete a pod in ${pod.status} state`, 400);

    pod.status = 'COMPLETED';
    pod.completedAt = new Date();
    await pod.save();
    return pod;
  }
}

export default new PodStateService();
