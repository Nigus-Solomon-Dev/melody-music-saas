const Subscription = require('../models/Subscription');
const { createCheckoutSession } = require('../services/stripeService');
const PRICE_IDS = {
  basic: 'price_1Ty6I31bMxbree3KLb2BlGm6',      // ← Replace with your Basic price ID
  pro: 'price_1Ty6JL1bMxbree3KtdwlsEBE',        // ← Replace with your Pro price ID
  enterprise: 'price_1Ty6KH1bMxbree3KMhqzUzJo', // ← Replace with your Enterprise price ID
};

const createSubscription = async (req, res) => {
  try {
    const user = req.user;
    const { plan } = req.body;
    if (!plan || !PRICE_IDS[plan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan. Choose: basic, pro, or enterprise'
      });
    }
    const priceId = PRICE_IDS[plan];
    const customerId = user.stripeCustomerId;
    const successUrl = `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.FRONTEND_URL}/pricing`;

    // creating session
    const session = await createCheckoutSession({
      customerId: customerId,
      priceId: priceId,
      successUrl: successUrl,
      cancelUrl: cancelUrl,
      metadata: { plan: plan }
    })
    res.status(200).json({
      success: true,
      message: 'Checkout session created',
      data: {
        sessionId: session.id,
        url: session.url,
      }
    });
  } catch (error) {
    console.error('Create Subscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription',
      error: error.message,
    });
  }

}
//canceling subscription
const cancelSubscription = async (req, res) => {
  try {
    const user = req.user;
    const subscription = await Subscription.findOne({
      userId: user._id,
      status: 'active'
    });
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();
    res.status(200).json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      data: {
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          currentPeriodEnd: subscription.currentPeriodEnd,
        }
      }
    });
  } catch (error) {
    console.error('Cancel Subscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error canceling subscription',
      error: error.message,
    });
  }
}

//current subscription details
const getMySubscription = async (req, res) => {
  try {
    const user = req.user;
    const subscription = await Subscription.findOne({
      userId: user._id,
      status: 'active'
    });
    if (!subscription) {
      return res.status(200).json({
        success: true,
        data: {
          hasSubscription: false,
          message: 'No active subscription'
        }
      });
    }
    res.status(200).json({
      success: true,
      data: {
        hasSubscription: true,
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
        }
      }
    });

  } catch (error) {
    console.error('Get Subscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription',
      error: error.message,
    });
  }
}

const createPortalSession = async (req, res) => {
  try {
    const user = req.user;
    const customerId = user.stripeCustomerId;
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'No Stripe customer found for this user'
      });
    }
    const { createPortalSession: createPortal } = require('../services/stripeService');
     const session = await createPortal({
            customerId: customerId,
            returnUrl: `${process.env.FRONTEND_URL}/dashboard`,
        });

           res.status(200).json({
            success: true,
            message: 'Portal session created',
            data: {
                url: session.url, // ← Frontend redirects here
            }
        });
  } catch (error) {
        console.error('Portal Session Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating portal session',
            error: error.message,
        });
    }
}
module.exports = {
  createSubscription,
  cancelSubscription,
  getMySubscription,
  createPortalSession
};