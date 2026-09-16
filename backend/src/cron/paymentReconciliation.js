import cron from 'node-cron';
import Payment from '../models/Payment.js';
import PaymentService from '../services/PaymentService.js';

export const runReconciliation = async () => {
  try {
    console.log('🔄 Running payment reconciliation job...');
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const stuckPayments = await Payment.find({
      status: { $in: ['created', 'pending'] },
      createdAt: { $lt: thirtyMinutesAgo, $gte: threeDaysAgo }
    });

    if (stuckPayments.length === 0) {
      console.log('✅ No stuck payments found.');
      return;
    }

    let resolved = 0;
    let failed = 0;

    for (const payment of stuckPayments) {
      if (!payment.razorpayOrderId) continue;

      try {
        const order = await PaymentService._razorpay.orders.fetch(payment.razorpayOrderId);
        
        if (order.status === 'paid') {
          const payments = await PaymentService._razorpay.orders.fetchPayments(payment.razorpayOrderId);
          const capturedPayment = payments.items.find(p => p.status === 'captured');
          
          if (capturedPayment) {
            console.log(`Reconciling missing payment: ${payment.razorpayOrderId}`);
            await PaymentService.fulfillPayment(payment.razorpayOrderId, capturedPayment.id, null);
            resolved++;
          }
        } else if (order.status === 'attempted' || order.status === 'created') {
          payment.status = 'failed';
          await payment.save();
          failed++;
        }
      } catch (err) {
        console.error(`Failed to reconcile payment ${payment._id}:`, err.message);
      }
    }

    console.log(`✅ Reconciliation complete. Resolved: ${resolved}, Marked Failed: ${failed}`);
  } catch (error) {
    console.error('❌ Reconciliation job failed:', error);
  }
};
export const startCron = () => {
  cron.schedule('*/15 * * * *', runReconciliation);
  console.log('⏱️ Payment reconciliation cron job scheduled.');
};
