import AppError from '../utils/AppError.js';
import HackathonRepository from '../repositories/HackathonRepository.js';
import HackathonRegistrationRepository from '../repositories/HackathonRegistrationRepository.js';
import HackathonTeam from '../models/HackathonTeam.js';
import HackathonSubmission from '../models/HackathonSubmission.js';
class HackathonAnalyticsService {

  async getOrganizerDashboard(hackathonId, organizerId) {
    const hackathon = await HackathonRepository.findById(hackathonId);
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    if (hackathon.organizer.toString() !== organizerId.toString()) {
      throw new AppError('Not authorized', 403);
    }

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const Payment = (await import('../models/Payment.js')).default;
    const HackathonRegistration = (await import('../models/HackathonRegistration.js')).default;

    const [registrationStats, submissionStats, teamCount, scoredSubmissionsCount, stuckPayments, cancelledPaidRegistrations] = await Promise.all([
      this._registrationsByStatus(hackathon._id),
      this._submissionsByDraftStatus(hackathon._id),
      HackathonTeam.countDocuments({ hackathon: hackathonId }),
      HackathonSubmission.countDocuments({ hackathon: hackathonId, isDraft: false, 'scores.0': { $exists: true } }),
      HackathonRegistration.aggregate([
        { $match: { hackathon: hackathon._id } },
        {
          $lookup: {
            from: 'payments',
            localField: 'payment',
            foreignField: '_id',
            as: 'paymentDoc'
          }
        },
        { $unwind: '$paymentDoc' },
        { 
          $match: { 
            'paymentDoc.status': { $in: ['created', 'pending'] },
            'paymentDoc.createdAt': { $lt: thirtyMinutesAgo }
          }
        },
        { $count: 'stuck' }
      ]),
      HackathonRegistration.countDocuments({ hackathon: hackathonId, status: 'cancelled', paymentStatus: 'paid' })
    ]);

    const regByStatus = registrationStats.reduce(
      (acc, r) => ({ ...acc, [r._id]: r.count }), {}
    );

    const stuckPaymentsCount = stuckPayments.length > 0 ? stuckPayments[0].stuck : 0;

    return {
      hackathon: { title: hackathon.title, slug: hackathon.slug, status: hackathon.status },
      registrations: {
        total:      hackathon.registrationCount,
        confirmed:  regByStatus.confirmed  || 0,
        pending:    regByStatus.pending    || 0,
        waitlisted: regByStatus.waitlisted || 0,
        cancelled:  regByStatus.cancelled  || 0,
      },
      teams: { total: teamCount },
      submissions: {
        drafts: submissionStats.find(s => s._id === true)?.count  || 0,
        final:  submissionStats.find(s => s._id === false)?.count || 0,
        scored: scoredSubmissionsCount,
      },
      operations: {
        pendingApprovals: regByStatus.pending || 0,
        stuckPayments: stuckPaymentsCount,
        pendingRefundRequests: cancelledPaidRegistrations
      }
    };
  }

  async _registrationsByStatus(hackathonObjectId) {
    return HackathonRegistrationRepository.aggregateByStatus(hackathonObjectId);
  }

  async _submissionsByDraftStatus(hackathonObjectId) {
    return HackathonSubmission.aggregate([
      { $match: { hackathon: hackathonObjectId } },
      { $group: { _id: '$isDraft', count: { $sum: 1 } } },
    ]);
  }
}

export default new HackathonAnalyticsService();
