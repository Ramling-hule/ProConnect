import AppError from '../utils/AppError.js';
import CacheService from './CacheService.js';
import CacheKeys from '../utils/CacheKeys.js';
import notificationManager from './notificationService.js';
import HackathonRepository from '../repositories/HackathonRepository.js';
import HackathonRegistrationRepository from '../repositories/HackathonRegistrationRepository.js';
import User from '../models/User.js';
import Hackathon from '../models/Hackathon.js';

class HackathonRegistrationService {

  async registerIndividual(hackathonId, userId, io) {
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    this._assertRegistrationWindowOpen(hackathon);

    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    this._assertEligibility(hackathon, user);

    const existing = await HackathonRegistrationRepository.findByHackathonAndUser(hackathonId, userId);
    if (existing) throw new AppError('Already registered for this hackathon', 409);

    let status = 'confirmed';
    let waitlistPosition = null;

    if (hackathon.approvalRequired) {
      status = 'pending';
    } else if (!hackathon.isFree) {
      status = 'pending';
    } else {
      const result = await this._consumeCapacityAtomically(hackathon);
      status = result.status;
      waitlistPosition = result.waitlistPosition;
    }

    const registration = await HackathonRegistrationRepository.create({
      hackathon: hackathonId,
      user: userId,
      registrationType: 'individual',
      status,
      waitlistPosition,
      paymentStatus: hackathon.isFree ? 'not_required' : 'pending',
    });

    if (status === 'confirmed') {
      await notificationManager.notify({
        recipientId: userId,
        type: 'hackathon_accepted',
        message: `You have successfully registered for "${hackathon.title}"`,
        link:    `/hackathons/${hackathon.slug}`,
        relatedId: hackathon._id,
      }, io);
    }

    return registration;
  }

  async _consumeCapacityAtomically(hackathon) {
    let status = 'confirmed';
    let waitlistPosition = null;

    if (hackathon.maxParticipants) {
      const updatedHackathon = await Hackathon.findOneAndUpdate(
        { _id: hackathon._id, registrationCount: { $lt: hackathon.maxParticipants } },
        { $inc: { registrationCount: 1 } },
        { new: true }
      );

      if (!updatedHackathon) {
        if (!hackathon.waitlistEnabled) throw new AppError('Hackathon is full', 409);
        
        const waitlistUpdate = await Hackathon.findOneAndUpdate(
          { _id: hackathon._id },
          { $inc: { waitlistCount: 1 } },
          { new: true }
        );
        status = 'waitlisted';
        waitlistPosition = waitlistUpdate.waitlistCount;
      }
    } else {
      await Hackathon.findByIdAndUpdate(hackathon._id, { $inc: { registrationCount: 1 } });
    }

    return { status, waitlistPosition };
  }

  async approveRegistration(registrationId, organizerId, io) {
    const registration = await HackathonRegistrationRepository.findById(registrationId);
    if (!registration) throw new AppError('Registration not found', 404);

    const hackathon = await Hackathon.findById(registration.hackathon);
    if (hackathon.organizer.toString() !== organizerId.toString()) {
      throw new AppError('Only the organizer can approve registrations', 403);
    }

    if (registration.status !== 'pending') {
      throw new AppError('Registration is not in pending state', 400);
    }

    const { status, waitlistPosition } = await this._consumeCapacityAtomically(hackathon);
    
    registration.status = status;
    registration.waitlistPosition = waitlistPosition;
    registration.approvedBy = organizerId;
    registration.approvedAt = new Date();
    await HackathonRegistrationRepository.save(registration);

    if (status === 'confirmed') {
      await notificationManager.notify({
        recipientId: registration.user,
        type: 'hackathon_accepted',
        message: `Your registration for "${hackathon.title}" has been approved!`,
        link: `/hackathons/${hackathon.slug}`,
        relatedId: hackathon._id,
      }, io);
    }

    return registration;
  }

  async rejectRegistration(registrationId, organizerId, reason, io) {
    const registration = await HackathonRegistrationRepository.findById(registrationId);
    if (!registration) throw new AppError('Registration not found', 404);

    const hackathon = await Hackathon.findById(registration.hackathon);
    if (hackathon.organizer.toString() !== organizerId.toString()) {
      throw new AppError('Only the organizer can reject registrations', 403);
    }

    if (registration.status !== 'pending') {
      throw new AppError('Registration is not in pending state', 400);
    }

    registration.status = 'rejected';
    registration.rejectedAt = new Date();
    registration.rejectionReason = reason || null;
    await HackathonRegistrationRepository.save(registration);

    await notificationManager.notify({
        recipientId: registration.user,
        type: 'hackathon_rejected',
        message: `Your registration for "${hackathon.title}" was not approved.`,
        link: `/hackathons/${hackathon.slug}`,
        relatedId: hackathon._id,
    }, io);

    return registration;
  }

  async checkIn(registrationId, actorId) {
    const registration = await HackathonRegistrationRepository.findById(registrationId);
    if (!registration) throw new AppError('Registration not found', 404);

    const hackathon = await Hackathon.findById(registration.hackathon);
    if (hackathon.organizer.toString() !== actorId.toString() && registration.user.toString() !== actorId.toString()) {
      throw new AppError('Not authorized to perform check-in', 403);
    }

    if (registration.status !== 'confirmed') {
      throw new AppError(`Cannot check in a ${registration.status} registration`, 400);
    }

    if (registration.checkedIn) {
      return registration;
    }

    registration.checkedIn = true;
    registration.checkInTime = new Date();
    await HackathonRegistrationRepository.save(registration);

    await notificationManager.notify({
      recipientId: registration.user,
      type: 'check_in_confirmed',
      message: `You have been checked in for "${hackathon?.title || 'the hackathon'}"! Welcome!`,
      link: hackathon ? `/hackathons/${hackathon.slug}` : '/hackathons',
      relatedId: registration.hackathon,
    }, null);

    return registration;
  }

  async cancelRegistration(registrationId, userId, io) {
    const reg = await HackathonRegistrationRepository.findById(registrationId);
    if (!reg)                        throw new AppError('Registration not found', 404);
    if (reg.user.toString() !== userId.toString()) throw new AppError('Not authorized', 403);
    if (reg.status === 'cancelled')  throw new AppError('Already cancelled', 400);

    const wasConfirmed = reg.status === 'confirmed';

    if (reg.paymentStatus === 'paid') {
      const PaymentService = (await import('./PaymentService.js')).default;
      try {
        const refundResult = await PaymentService.refundHackathonRegistration(registrationId, userId);
        if (!refundResult.refunded && refundResult.reason === 'policy_denied') {
        }
      } catch (err) {
        throw new AppError('Cancellation failed: Could not process refund with payment gateway', 500);
      }
    }

    reg.status = 'cancelled';
    await HackathonRegistrationRepository.save(reg);

    if (wasConfirmed) {
      await this._handleCancellationWaitlistPromotion(reg.hackathon._id, io);
    }

    return reg;
  }

  async _handleCancellationWaitlistPromotion(hackathonId, io) {
    const next = await HackathonRegistrationRepository.findFirstWaitlisted(hackathonId);
    if (next) {
      next.status = 'confirmed';
      next.waitlistPosition = null;
      await HackathonRegistrationRepository.save(next);
      
      await notificationManager.notify({
        recipientId: next.user,
        type: 'hackathon_accepted',
        message: `You've been promoted from the waitlist for the hackathon!`,
        link:    `/hackathons`,
        relatedId: hackathonId,
      }, io);
    } else {
      await Hackathon.findByIdAndUpdate(hackathonId, { $inc: { registrationCount: -1 } });
    }
  }

  _assertRegistrationWindowOpen(hackathon) {
    const now = new Date();
    if (now > hackathon.timeline.registrationClose) {
      throw new AppError('Registration deadline has passed', 400);
    }
    if (now < hackathon.timeline.registrationOpen) {
      throw new AppError('Registration has not opened yet', 400);
    }
  }

  _assertEligibility(hackathon, user) {
    if (!hackathon.eligibility) return;
    const { college, minYear, maxYear, openToPublic } = hackathon.eligibility;
    if (openToPublic === false && user.role !== 'student') {
      throw new AppError('This hackathon is only open to students', 403);
    }
    if (college) {
      if (!user.institute || user.institute.toLowerCase() !== college.toLowerCase()) {
         throw new AppError(`This hackathon is restricted to students of ${college}`, 403);
      }
    }
    if (minYear || maxYear) {
      let graduationYear = null;
      if (user.education && user.education.length > 0) {
        const currentEd = user.education[0]; 
        graduationYear = currentEd.passingYear || currentEd.graduationYear;
      }
      if (graduationYear) {
        if (minYear && graduationYear < minYear) throw new AppError(`Graduation year must be at least ${minYear}`, 403);
        if (maxYear && graduationYear > maxYear) throw new AppError(`Graduation year must be at most ${maxYear}`, 403);
      }
    }
  }

  async exportRegistrationsCSV(hackathonId) {
    const registrations = await HackathonRegistrationRepository.findMany({ hackathon: hackathonId })
      .populate('user', 'name email institute role')
      .lean();
    
    let csv = 'Name,Email,Role,Institute,Status,Type,PaymentStatus,WaitlistPosition\n';
    for (const r of registrations) {
      if (!r.user) continue;
      const name = `"${(r.user.name || '').replace(/"/g, '""')}"`;
      const email = `"${r.user.email || ''}"`;
      const institute = `"${(r.user.institute || '').replace(/"/g, '""')}"`;
      csv += `${name},${email},${r.user.role},${institute},${r.status},${r.registrationType},${r.paymentStatus},${r.waitlistPosition || ''}\n`;
    }
    return csv;
  }

  async bulkUpdateStatus(hackathonId, registrationIds, status, io) {
    if (!['confirmed', 'waitlisted', 'rejected', 'pending'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }
    const registrations = await HackathonRegistrationRepository.findMany({
      _id: { $in: registrationIds },
      hackathon: hackathonId
    });

    const results = { updated: 0, failed: 0 };
    for (const reg of registrations) {
      try {
        reg.status = status;
        await HackathonRegistrationRepository.save(reg);
        
        if (status === 'confirmed') {
          await notificationManager.notify({
            recipientId: reg.user,
            type: 'hackathon_accepted',
            message: `Your registration for the hackathon has been confirmed!`,
            link:    `/hackathons/${hackathonId}`,
            relatedId: hackathonId,
          }, io);
        } else if (status === 'rejected') {
          await notificationManager.notify({
            recipientId: reg.user,
            type: 'hackathon_rejected',
            message: `Your registration for the hackathon has been rejected.`,
            link:    `/hackathons/${hackathonId}`,
            relatedId: hackathonId,
          }, io);
        }
        results.updated++;
      } catch (err) {
        results.failed++;
      }
    }
    return results;
  }
}

export default new HackathonRegistrationService();
