import express from 'express';
import { createPaymentIntent, verifyKhaltiPayment, initiateKhaltiPayment, confirmStripePayment, createBoostStripeSession } from './paymentController.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/confirm-stripe', protect, confirmStripePayment);
router.post('/initiate-khalti', protect, initiateKhaltiPayment);
router.post('/verify-khalti', protect, verifyKhaltiPayment);
router.post('/boost/stripe-session', protect, createBoostStripeSession);

export default router;
