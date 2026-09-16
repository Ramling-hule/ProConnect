import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env.js';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import HackathonRegistration from '../models/HackathonRegistration.js';
import Hackathon from '../models/Hackathon.js';

class PaymentService {
  constructor() {
    this._razorpay = new Razorpay({
      key_id:     env.razorpayKeyId     || process.env.RAZORPAY_KEY_ID     || 'dummy_key_id',
      key_secret: env.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
    });
  }
  
  async processWebhookEvent(event) {
    const { event: eventName, payload } = event;
    const paymentEntity = payload.payment?.entity;
    if (!paymentEntity) return;

    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;

    if (eventName === 'order.paid' || eventName === 'payment.captured') {
      await this.fulfillPayment(razorpayOrderId, razorpayPaymentId);
    } else if (eventName === 'payment.failed') {
      await Payment.findOneAndUpdate(
        { razorpayOrderId },
        { status: 'failed' }
      );
    } else if (eventName === 'refund.processed') {
      await Payment.findOneAndUpdate(
        { razorpayOrderId },
        { status: 'refunded' }
      );
    }
  }

  async fulfillPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature = null) {
    const mongoose = (await import('mongoose')).default;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const payment = await Payment.findOne({ razorpayOrderId }).session(session);
      if (!payment) {
        await session.abortTransaction();
        throw new Error('Payment not found');
      }
      if (['captured', 'refunded'].includes(payment.status)) {
        await session.commitTransaction();
        return { success: true, alreadyCaptured: true, payment };
      }
      payment.status = 'captured';
      payment.razorpayPaymentId = razorpayPaymentId;
      if (razorpaySignature) payment.razorpaySignature = razorpaySignature;
      await payment.save({ session });
      if (payment.booking) {
        const Booking = (await import('../models/Booking.js')).default;
        const booking = await Booking.findById(payment.booking).session(session);
        if (booking && booking.status !== 'Confirmed') {
          booking.status = 'Confirmed';
          booking.meetingLink = `https://meet.jit.si/ProConnect_${booking._id}`;
          await booking.save({ session });
        }
      } else if (payment.hackathonRegistration) {
        const HackathonRegistration = (await import('../models/HackathonRegistration.js')).default;
        const Hackathon = (await import('../models/Hackathon.js')).default;
        
        const registration = await HackathonRegistration.findById(payment.hackathonRegistration).session(session);
        if (registration && registration.status !== 'confirmed') {
          registration.status = 'confirmed';
          registration.paymentStatus = 'paid';
          await registration.save({ session });
          await Hackathon.findByIdAndUpdate(registration.hackathon, { $inc: { registrationCount: 1 } }, { session });
        }
      } else if (payment.hackathonTeam) {
        const HackathonTeam = (await import('../models/HackathonTeam.js')).default;
        const HackathonRegistration = (await import('../models/HackathonRegistration.js')).default;
        const Hackathon = (await import('../models/Hackathon.js')).default;

        const team = await HackathonTeam.findById(payment.hackathonTeam).session(session);
        if (team && team.status !== 'locked') {
          const hackathonDoc = await Hackathon.findById(team.hackathon).session(session);
          const memberCount = team.members.length;
          if (hackathonDoc.maxParticipants) {
            const updatedHackathon = await Hackathon.findOneAndUpdate(
              {
                _id: team.hackathon,
                $expr: { $lte: [{ $add: ['$registrationCount', memberCount] }, '$maxParticipants'] }
              },
              { $inc: { registrationCount: memberCount } },
              { new: true, session }
            );
            if (!updatedHackathon) {
              await session.abortTransaction();
              throw new Error('Not enough capacity for the full team');
            }
          } else {
            await Hackathon.findByIdAndUpdate(team.hackathon, { $inc: { registrationCount: memberCount } }, { session });
          }

          team.status = 'locked';
          team.isLookingForMembers = false;
          await team.save({ session });
          
          const membersData = team.members.map(m => ({
            user: m.user,
            hackathon: team.hackathon,
            registrationType: 'team',
            teamId: team._id,
            status: 'confirmed',
            paymentStatus: 'paid'
          }));
          await HackathonRegistration.insertMany(membersData, { session });
        }
      } else if (payment.podMember) {
        const PodMember = (await import('../models/PodMember.js')).default;
        const member = await PodMember.findById(payment.podMember).session(session);
        if (member && member.status !== 'ACTIVE') {
          member.status = 'ACTIVE';
          member.joinedAt = new Date();
          await member.save({ session });
        }
      }

      await session.commitTransaction();
      return { success: true, payment };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }
  
  async createGenericOrder(type, entityId, userId) {
    let entity;
    let amount = 0;
    const mongoose = (await import('mongoose')).default;

    if (type === 'session') {
      const Booking = (await import('../models/Booking.js')).default;
      entity = await Booking.findById(entityId);
      if (!entity || entity.status !== 'PENDING_PAYMENT') throw new Error('Invalid session booking');
      amount = entity.amount;
    } else if (type === 'pod') {
      const PodMember = (await import('../models/PodMember.js')).default;
      entity = await PodMember.findById(entityId).populate('podId');
      if (!entity || entity.status !== 'PENDING_PAYMENT') throw new Error('Invalid pod registration');
      amount = entity.podId?.requirements?.budget || 0;
    } else if (type === 'webinar') {
      const WebinarRegistration = (await import('../models/WebinarRegistration.js')).default;
      entity = await WebinarRegistration.findById(entityId).populate('webinar');
      if (!entity || entity.status !== 'PENDING_PAYMENT') throw new Error('Invalid webinar registration');
      amount = entity.webinar?.price || 0;
    } else {
      throw new Error('Invalid booking type');
    }

    if (amount <= 0) {
      throw new Error('This booking is free and does not require payment');
    }

    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${type}_${entity._id}`,
      payment_capture: 1,
    };

    let order;
    try {
      order = await this._razorpay.orders.create(options);
    } catch {
      throw new Error('Failed to create Razorpay order');
    }

    const paymentData = {
      user: userId,
      razorpayOrderId: order.id,
      amount: amount,
      status: 'created',
    };
    if (type === 'session') paymentData.booking = entity._id;
    if (type === 'pod') paymentData.podMember = entity._id;
    if (type === 'webinar') paymentData.webinarRegistration = entity._id;

    const payment = new Payment(paymentData);
    await payment.save();

    if (type === 'session') { entity.payment = payment._id; await entity.save(); }
    if (type === 'pod') { }
    if (type === 'webinar') { entity.payment = payment._id; await entity.save(); }

    return { order, paymentId: payment._id };
  }

  async verifyGenericPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const keySecret = env.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      await Payment.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { status: 'failed' });
      throw new Error('Invalid payment signature');
    }
    const result = await this.fulfillPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    return { success: true };
  }

  async createOrder(bookingId, userId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found'); err.status = 404; throw err;
    }
    if (booking.status !== 'Payment Pending') {
      const err = new Error('Booking is not in pending payment state'); err.status = 400; throw err;
    }

    const options = {
      amount: booking.amount * 100,
      currency: 'INR',
      receipt: `receipt_order_${booking._id}`,
      payment_capture: 1,
    };

    let order;
    try {
      order = await this._razorpay.orders.create(options);
    } catch {
      const err = new Error('Failed to create Razorpay order'); err.status = 500; throw err;
    }

    const payment = new Payment({
      booking: booking._id,
      user: userId,
      razorpayOrderId: order.id,
      amount: booking.amount,
      status: 'created',
    });
    await payment.save();

    booking.payment = payment._id;
    await booking.save();

    return { order, paymentId: payment._id };
  }

  async verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId }) {
    const keySecret = env.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      await Payment.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { status: 'failed' });
      const err = new Error('Invalid payment signature'); err.status = 400; throw err;
    }
    const { payment } = await this.fulfillPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    const booking = await Booking.findById(payment.booking || bookingId);
    return { success: true, meetingLink: booking?.meetingLink };
  }

  async createHackathonOrder(registrationId, userId) {
    const registration = await HackathonRegistration.findById(registrationId);
    if (!registration) {
      const err = new Error('Registration not found'); err.status = 404; throw err;
    }
    if (registration.user.toString() !== userId.toString()) {
      const err = new Error('Not authorized'); err.status = 403; throw err;
    }

    const hackathon = await Hackathon.findById(registration.hackathon);
    if (!hackathon) {
      const err = new Error('Hackathon not found'); err.status = 404; throw err;
    }

    const options = {
      amount:          hackathon.registrationFee * 100,
      currency:        hackathon.currency || 'INR',
      receipt:         `hack_reg_${registration._id}`,
      payment_capture: 1,
    };

    let order;
    try {
      order = await this._razorpay.orders.create(options);
    } catch {
      const err = new Error('Failed to create Razorpay order'); err.status = 500; throw err;
    }

    const payment = new Payment({
      hackathonRegistration: registration._id,
      user: userId,
      razorpayOrderId: order.id,
      amount: hackathon.registrationFee,
      currency: hackathon.currency || 'INR',
      status: 'created',
    });
    await payment.save();

    registration.payment = payment._id;
    registration.paymentStatus = 'pending';
    await registration.save();

    return { order, paymentId: payment._id };
  }

  async verifyHackathonPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId }) {
    const keySecret = env.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      await Payment.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { status: 'failed' });
      const err = new Error('Invalid payment signature'); err.status = 400; throw err;
    }
    await this.fulfillPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    return { success: true };
  }

  async createTeamHackathonOrder(teamId, userId) {
    const HackathonTeam = (await import('../models/HackathonTeam.js')).default;
    const team = await HackathonTeam.findById(teamId).populate('hackathon');
    if (!team) { const err = new Error('Team not found'); err.status = 404; throw err; }
    if (team.captain.toString() !== userId.toString()) { const err = new Error('Only the captain can initiate payment'); err.status = 403; throw err; }

    const hackathon = team.hackathon;
    let totalAmount = hackathon.registrationFee;
    if (hackathon.feeModel === 'per_participant') {
      totalAmount = hackathon.registrationFee * team.members.length;
    }

    if (totalAmount === 0) {
      return { isFree: true, teamId: team._id };
    }

    const options = {
      amount:          totalAmount * 100,
      currency:        hackathon.currency || 'INR',
      receipt:         `hack_team_${team._id}`,
      payment_capture: 1,
    };

    let order;
    try {
      order = await this._razorpay.orders.create(options);
    } catch {
      const err = new Error('Failed to create Razorpay order'); err.status = 500; throw err;
    }

    const payment = new Payment({
      hackathonTeam: team._id,
      user: userId,
      razorpayOrderId: order.id,
      amount: totalAmount,
      currency: hackathon.currency || 'INR',
      status: 'created',
    });
    await payment.save();

    return { order, paymentId: payment._id };
  }

  async verifyTeamHackathonPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature, teamId }) {
    const keySecret = env.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      await Payment.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { status: 'failed' });
      const err = new Error('Invalid payment signature'); err.status = 400; throw err;
    }
    await this.fulfillPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    return { success: true };
  }

  calculateRefundAmount(hackathon, amountPaid) {
    if (!hackathon.refundPolicy || !amountPaid) return 0;
    
    const now = new Date();
    const { fullRefundBeforeDate, partialRefundPercent, noRefundAfterDate } = hackathon.refundPolicy;

    if (fullRefundBeforeDate && now < fullRefundBeforeDate) {
      return amountPaid;
    }
    
    if (noRefundAfterDate && now >= noRefundAfterDate) {
      return 0;
    }
    
    if (partialRefundPercent) {
      return (amountPaid * partialRefundPercent) / 100;
    }
    return 0;
  }

  async refundHackathonRegistration(registrationId, actorId) {
    const registration = await HackathonRegistration.findById(registrationId).populate('hackathon');
    if (!registration) throw new Error('Registration not found');

    const hackathon = registration.hackathon;
    if (hackathon.isFree) return { refunded: false, reason: 'free' };

    const payment = await Payment.findOne({ hackathonRegistration: registration._id, status: 'captured' });
    if (!payment || !payment.razorpayPaymentId) {
       return { refunded: false, reason: 'no_captured_payment' };
    }

    const refundAmount = this.calculateRefundAmount(hackathon, payment.amount);
    
    if (refundAmount <= 0) {
       return { refunded: false, amount: 0, reason: 'policy_denied' };
    }

    try {
      const refundOptions = {
        amount: Math.round(refundAmount * 100),
        receipt: `refund_reg_${registration._id}`
      };
      
      const refund = await this._razorpay.payments.refund(payment.razorpayPaymentId, refundOptions);
      payment.status = 'refunded';
      await payment.save();

      registration.paymentStatus = 'refunded';
      await registration.save();

      return { refunded: true, amount: refundAmount, razorpayRefundId: refund.id };
    } catch (err) {
      console.error('Razorpay refund failed:', err);
      throw new Error('Failed to process refund with payment gateway');
    }
  }
  async refundHackathonTeam(teamId, actorId) {
    const HackathonTeam = (await import('../models/HackathonTeam.js')).default;
    const team = await HackathonTeam.findById(teamId).populate('hackathon');
    if (!team) throw new Error('Team not found');

    const hackathon = team.hackathon;
    if (hackathon.isFree) return { refunded: false, reason: 'free' };

    const payment = await Payment.findOne({ hackathonTeam: team._id, status: 'captured' });
    if (!payment || !payment.razorpayPaymentId) {
       return { refunded: false, reason: 'no_captured_payment' };
    }

    const refundAmount = this.calculateRefundAmount(hackathon, payment.amount);
    
    if (refundAmount <= 0) {
       return { refunded: false, amount: 0, reason: 'policy_denied' };
    }

    try {
      const refundOptions = {
        amount: Math.round(refundAmount * 100),
        receipt: `refund_team_${team._id}`
      };
      
      const refund = await this._razorpay.payments.refund(payment.razorpayPaymentId, refundOptions);
      
      payment.status = 'refunded';
      await payment.save();

      return { refunded: true, amount: refundAmount, razorpayRefundId: refund.id };
    } catch (err) {
      console.error('Razorpay team refund failed:', err);
      throw new Error('Failed to process team refund with payment gateway');
    }
  }
}

export default new PaymentService();
