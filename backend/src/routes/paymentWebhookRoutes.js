import express from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';
import PaymentService from '../services/PaymentService.js';

const router = express.Router();
router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;
    const secret = env.razorpayWebhookSecret;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid Razorpay webhook signature');
      return res.status(400).send('Invalid signature');
    }
    const event = JSON.parse(body.toString('utf-8'));
    await PaymentService.processWebhookEvent(event);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

export default router;
