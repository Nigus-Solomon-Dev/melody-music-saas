const Subscription = require('../models/Subscription');
const { createCheckoutSession } = require('../services/stripeService');
const PRICE_IDS = {
  basic: {
    monthly: 'price_1Ty6I31bMxbree3KLb2BlGm6',
    annual: 'price_1Tzma31bMxbree3KiDnfiqGn',
  },
  pro: {
    monthly: 'price_1Ty6JL1bMxbree3KtdwlsEBE',
    annual: 'price_1Tzma41bMxbree3KQ90wxpSH',
  },
  enterprise: {
    monthly: 'price_1Ty6KH1bMxbree3KMhqzUzJo',
    annual: 'price_1Tzma51bMxbree3Kvz0G7e8x',
  },
};

//create subscription
const createSubscription = async (req, res) => {
  try {
    const user = req.user;
    const { plan, trialDays, billingCycle } = req.body;
    if (!plan || !PRICE_IDS[plan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan. Choose: basic, pro, or enterprise'
      });
    }
    const interval = billingCycle === 'annual' ? 'annual' : 'monthly';
    const priceId = PRICE_IDS[plan][interval];
    const customerId = user.stripeCustomerId;
    const successUrl = `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.FRONTEND_URL}/pricing`;

    // creating session
    const session = await createCheckoutSession({
      customerId: customerId,
      priceId: priceId,
      successUrl: successUrl,
      cancelUrl: cancelUrl,
      metadata: { plan: plan },
      trialDays: trialDays || 0,
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
//Upgrade/downgrade subscription
const upgradeSubscription = async (req, res) => {
  try {
    const user = req.user;
    const { newPlan } = req.body;
    if (!newPlan || !PRICE_IDS[newPlan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan. Choose: basic, pro, or enterprise'
      });
    }
    //get user active subscription
    const subscription = await Subscription.findOne({
      userId: user._id,
      status: { $in: ['active', 'trialing'] }
    });
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }
    //checking if the plan already exist
    if (subscription.plan === newPlan) {
      return res.status(400).json({
        success: false,
        message: `Already on ${newPlan} plan`
      });
    }
    const newPriceId = PRICE_IDS[newPlan].monthly;
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // fetch stripe subscription to get the item ID (si_xxx) — required by Stripe to update price
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    const itemId = stripeSubscription.items.data[0].id;

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: 'create_prorations',
    });

    // use dates from the already-retrieved subscription (avoid extra API call)
    // In Stripe API dahlia+, current_period_start/end live on the subscription item
    const stripeItem = stripeSubscription.items.data[0];
    const periodStart = stripeItem.current_period_start ?? stripeSubscription.current_period_start;
    const periodEnd = stripeItem.current_period_end ?? stripeSubscription.current_period_end;

    subscription.plan = newPlan;
    subscription.status = stripeSubscription.status;
    subscription.stripeSubscriptionItemId = itemId;
    subscription.stripePriceId = newPriceId;
    // only update dates if Stripe returned valid timestamps
    if (periodStart) subscription.currentPeriodStart = new Date(periodStart * 1000);
    if (periodEnd) subscription.currentPeriodEnd = new Date(periodEnd * 1000);
    await subscription.save();

    res.status(200).json({
      success: true,
      message: `Plan changed to ${newPlan}`,
      data: {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      }
    });

  } catch (error) {
    console.error('Upgrade Subscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing plan',
      error: error.message,
    });
  }
};
//canceling subscription
const cancelSubscription = async (req, res) => {
  try {
    const user = req.user;
    const subscription = await Subscription.findOne({
      userId: user._id,
      status: { $in: ['active', 'trialing'] }
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

//resume (un-cancel) a subscription scheduled for cancellation
const resumeSubscription = async (req, res) => {
  try {
    const user = req.user;
    const subscription = await Subscription.findOne({
      userId: user._id,
      status: { $in: ['active', 'trialing'] },
      cancelAtPeriodEnd: true,
    });
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription scheduled for cancellation'
      });
    }
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
    subscription.cancelAtPeriodEnd = false;
    await subscription.save();
    res.status(200).json({
      success: true,
      message: 'Subscription resumed',
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
    console.error('Resume Subscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resuming subscription',
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
      status: { $in: ['active', 'trialing'] }
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
          trialEnd: subscription.trialEnd,
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
  createPortalSession,
  upgradeSubscription,
  resumeSubscription,
};