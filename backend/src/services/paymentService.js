import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { config } from 'dotenv';
config();

// Initialize payment gateways
let stripe, razorpay;

const PAYMENT_GATEWAY = process.env.PAYMENT_GATEWAY || 'stripe'; // 'stripe' or 'razorpay'

if (PAYMENT_GATEWAY === 'stripe' && process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
  console.log('✅ Stripe initialized');
}

if (PAYMENT_GATEWAY === 'razorpay' && process.env.RAZORPAY_KEY_ID) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('✅ Razorpay initialized');
}

// Pricing plans
export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['Basic profile', '5 job applications/month', 'Limited connections']
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 999, // INR or cents
    interval: 'month',
    features: ['Enhanced profile', 'Unlimited applications', 'Priority support', 'Analytics']
  },
  COMPANY_BASIC: {
    id: 'company_basic',
    name: 'Company Basic',
    price: 4999,
    interval: 'month',
    features: ['5 job postings', 'Basic analytics', 'Company page']
  },
  COMPANY_PRO: {
    id: 'company_pro',
    name: 'Company Pro',
    price: 9999,
    interval: 'month',
    features: ['Unlimited job postings', 'Advanced analytics', 'Featured company', 'Priority support']
  }
};

// Stripe Payment Methods
export const createStripeCheckoutSession = async (userId, planId, email) => {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const plan = PLANS[planId.toUpperCase()];
  if (!plan || plan.price === 0) {
    throw new Error('Invalid plan');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: {
            name: plan.name,
            description: plan.features.join(', '),
          },
          unit_amount: plan.price * 100, // Convert to paise
          recurring: plan.interval ? { interval: plan.interval } : undefined,
        },
        quantity: 1,
      },
    ],
    mode: plan.interval ? 'subscription' : 'payment',
    success_url: `${process.env.CLIENT_ORIGIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_ORIGIN}/payment/cancel`,
    customer_email: email,
    metadata: {
      userId,
      planId,
    },
  });

  return { sessionId: session.id, url: session.url };
};

export const verifyStripeWebhook = (payload, signature) => {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

// Razorpay Payment Methods
export const createRazorpayOrder = async (userId, planId, email) => {
  if (!razorpay) {
    throw new Error('Razorpay not configured');
  }

  const plan = PLANS[planId.toUpperCase()];
  if (!plan || plan.price === 0) {
    throw new Error('Invalid plan');
  }

  const order = await razorpay.orders.create({
    amount: plan.price * 100, // Convert to paise
    currency: 'INR',
    receipt: `order_${userId}_${Date.now()}`,
    notes: {
      userId,
      planId,
      email,
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
};

export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  if (!razorpay) {
    throw new Error('Razorpay not configured');
  }

  const crypto = require('crypto');
  const text = `${orderId}|${paymentId}`;
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');

  return generated_signature === signature;
};

// Generic payment creation
export const createPayment = async (userId, planId, email) => {
  if (PAYMENT_GATEWAY === 'stripe') {
    return await createStripeCheckoutSession(userId, planId, email);
  } else if (PAYMENT_GATEWAY === 'razorpay') {
    return await createRazorpayOrder(userId, planId, email);
  } else {
    throw new Error('No payment gateway configured');
  }
};

// Handle successful payment
export const handleSuccessfulPayment = async (userId, planId, paymentDetails) => {
  // Update user subscription in database
  // This should be implemented based on your User model
  console.log('✅ Payment successful:', { userId, planId, paymentDetails });
  
  // TODO: Update user's subscription status in database
  // await User.findByIdAndUpdate(userId, {
  //   subscription: {
  //     plan: planId,
  //     status: 'active',
  //     startDate: new Date(),
  //     endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  //     paymentId: paymentDetails.paymentId
  //   }
  // });

  return { success: true };
};

export default {
  createPayment,
  createStripeCheckoutSession,
  createRazorpayOrder,
  verifyStripeWebhook,
  verifyRazorpaySignature,
  handleSuccessfulPayment,
  PLANS,
};
