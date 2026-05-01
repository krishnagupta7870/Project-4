import Stripe from 'stripe';
import axios from 'axios';
import Payment from '../../models/Payment.js';
import Product from '../../models/Product.js';

let stripe;

const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY is missing in backend .env");
    }
    if (!stripe) {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripe;
};

export const createPaymentIntent = async (req, res) => {
    try {
        const stripeInstance = getStripe();
        const { price } = req.body;

        // Calculate fee based on product price
        let fee = 0;
        const productPrice = Number(price);

        // Fee Structure (Minimum ~60 to satisfy Stripe >$0.50 requirement)
        if (productPrice < 1000) {
            fee = 10;
        } else if (productPrice < 100000) {
            fee = 50;
        } else {
            fee = 100;
        }

        // Stripe expects amount in smallest currency unit (e.g., cents/paisa)
        // Assuming the fee is in main unit (e.g., Rupees), so multiply by 100
        const amount = fee * 100;

        const paymentIntent = await stripeInstance.paymentIntents.create({
            amount,
            currency: 'usd', // Using USD - charge amount directly (₹10 = $10, no conversion)
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId: req.user?._id?.toString(),
                purpose: 'listing_fee'
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            fee: fee,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Verify/Confirm Stripe Payment (Webhook preferred, but manual confirm for now)
export const confirmStripePayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;
        const stripeInstance = getStripe();

        const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            // Save to DB
            let payment = await Payment.findOne({ transactionId: paymentIntentId });
            if (!payment) {
                payment = new Payment({
                    user: req.user._id,
                    amount: paymentIntent.amount / 100,
                    currency: paymentIntent.currency,
                    method: 'stripe',
                    status: 'completed',
                    transactionId: paymentIntentId,
                    paymentGatewayData: paymentIntent
                });
                await payment.save();
            }
            res.json({
                success: true,
                message: "Payment confirmed",
                paymentId: payment._id,
                paymentDetails: {
                    id: payment.transactionId,
                    status: payment.status,
                    amount: payment.amount,
                    provider: 'stripe'
                }
            });
        } else {
            res.status(400).json({ success: false, message: "Payment not succeeded yet" });
        }
    } catch (error) {
        console.error("Stripe Confirm Error:", error);
        res.status(500).json({ message: "Confirmation failed" });
    }
};

export const createBoostStripeSession = async (req, res) => {
    try {
        const stripeInstance = getStripe();
        const { productId, hours, amount } = req.body;
        if (!productId || !hours || !amount) {
            return res.status(400).json({ message: "productId, hours and amount are required" });
        }
        const product = await Product.findById(productId).select('name seller');
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        if (!req.user || (req.user.role !== 'admin' && String(product.seller) !== String(req.user._id))) {
            return res.status(403).json({ message: "Not allowed" });
        }
        const origin = process.env.FRONTEND_URL || 'http://localhost:3000';
        const session = await stripeInstance.checkout.sessions.create({
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'npr',
                        product_data: { name: `Boost: ${product.name} (${hours}h)` },
                        unit_amount: Number(amount) * 100
                    },
                    quantity: 1
                }
            ],
            success_url: `${origin}/boost-payment/success?productId=${encodeURIComponent(productId)}&hours=${encodeURIComponent(hours)}&amount=${encodeURIComponent(amount)}&provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/seller`,
            metadata: {
                userId: req.user._id.toString(),
                productId,
                hours: String(hours),
                amount: String(amount),
                purpose: 'product_boost'
            }
        });
        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ message: "Failed to create checkout session" });
    }
};

// Initiate Khalti Payment (ePayment V2)
export const initiateKhaltiPayment = async (req, res) => {
    try {
        const { amount, purchase_order_id, purchase_order_name, return_url, website_url } = req.body;

        if (!process.env.KHALTI_SECRET_KEY) {
            return res.status(500).json({ message: "Khalti Secret Key missing" });
        }

        const payload = {
            return_url,
            website_url,
            amount: 100 || 0,
            purchase_order_id,
            purchase_order_name,
            purchase_order_url: website_url,
        };

        const response = await axios.post(
            'https://a.khalti.com/api/v2/epayment/initiate/',
            payload,
            {
                headers: {
                    'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        res.json(response.data); // { pidx, payment_url, expires_at, expires_in }
    } catch (error) {
        console.error("Khalti Initiate Error:", error.response?.data || error.message);
        res.status(500).json({
            message: "Failed to initiate Khalti payment",
            details: error.response?.data || error.message
        });
    }
};

export const verifyKhaltiPayment = async (req, res) => {
    try {
        const { pidx, amount } = req.body;

        if (!pidx) {
            return res.status(400).json({ message: "PIDX required" });
        }

        const response = await axios.post(
            'https://a.khalti.com/api/v2/epayment/lookup/',
            { pidx },
            {
                headers: {
                    'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        // status can be "Completed", "Pending", "Initiated", "Refunded", "Expired", "User canceled"
        if (response.data.status === 'Completed') {
            // Save to DB
            // Check if already saved
            let payment = await Payment.findOne({ transactionId: pidx });
            if (!payment) {
                payment = new Payment({
                    user: req.user._id, // Assumes protected route
                    amount:amount || (response.data.total_amount / 100),
                    currency: 'NPR',
                    method: 'khalti',
                    status: 'completed',
                    transactionId: pidx,
                    paymentGatewayData: response.data
                });
                await payment.save();
            }

            res.json({
                success: true,
                message: "Payment verified",
                data: response.data,
                paymentId: payment._id,
                paymentDetails: {
                    id: payment.transactionId,
                    status: payment.status,
                    amount: payment.amount,
                    provider: 'khalti'
                }
            });
        } else {
            res.status(400).json({ success: false, message: `Payment status: ${response.data.status}`, data: response.data });
        }
    } catch (error) {
        console.error("Khalti Verify Error:", error.response?.data || error.message);
        res.status(500).json({ message: "Verification failed" });
    }
};
