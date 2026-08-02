const User = require('../models/User');
const Subscription = require('../models/Subscription');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {
  sendWelcomeEmail,
  sendPaymentFailedEmail,
  sendCancellationEmail,
  sendTrialEndingEmail
} = require('../services/emailService');
const ProcessedEvent = require('../models/ProcessedEvent');

//saves subscription to database
const handleCheckoutSessionCompleted = async (session) => {
  try {
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const itemId = stripeSubscription.items.data[0].id;
    
    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }
    const plan = session.metadata?.plan || 'basic';
    const subscription = stripeSubscription;
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
    // In Stripe API 2025+, current_period_start/end live on the subscription item
    const periodStart = stripeSubscription.items.data[0].current_period_start ?? stripeSubscription.current_period_start;
    const periodEnd = stripeSubscription.items.data[0].current_period_end ?? stripeSubscription.current_period_end;
    // Subscriptions with an active trial are 'trialing', otherwise 'active'
    const status = trialEnd ? 'trialing' : 'active';
    //creating subscription in database
    const subscriptionData = {
      userId: user._id,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      stripeSubscriptionItemId: itemId,
      stripePriceId: stripeSubscription.items.data[0].price.id,
      plan: plan,
      status: status,
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
      trialEnd: trialEnd,
      cancelAtPeriodEnd: false,
    };
    await Subscription.create(subscriptionData);
    console.log(` Subscription saved for user: ${user.email}`);
    console.log(`   Plan: ${plan}`);
    console.log(`   Status: ${subscriptionData.status}`);
    if (trialEnd) {
      console.log(`   Trial ends: ${trialEnd}`);
    }
    // Email must never fail the webhook (Stripe would retry and hit a duplicate-key error)
    try {
      await sendWelcomeEmail(user.email, user.name, plan);
    } catch (emailErr) {
      console.error('Welcome email failed (non-fatal):', emailErr.message);
    }
  } catch (error) {
    console.error('Error saving subscription:', error);
    throw error;
  }
}

//handle payment failled 
const handlePaymentFailed = async (invoice) => {
  try {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    const subscription = await Subscription.findOne({
      stripeSubscriptionId: subscriptionId
    });
    if (!subscription) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }

    subscription.status = 'past_due';
    await subscription.save();

    console.log(`⚠️ Payment failed for user: ${user.email}`);

    //send payment failed to email
    const portalUrl = `${process.env.FRONTEND_URL}/dashboard`;
    try {
      await sendPaymentFailedEmail(user.email, user.name, portalUrl);
    } catch (emailErr) {
      console.error('Payment failed email (non-fatal):', emailErr.message);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}
// 3D Secure / card re-authentication required (SCA)
const handlePaymentActionRequired = async (invoice) => {
  try {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;
    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      console.error('User not found for payment action required:', customerId);
      return;
    }

    const subscription = await Subscription.findOne({
      stripeSubscriptionId: subscriptionId
    });
    if (subscription) {
      subscription.status = 'past_due';
      await subscription.save();
    }

    console.log(` Payment action required for user: ${user.email} (3D Secure)`);

    const portalUrl = `${process.env.FRONTEND_URL}/dashboard`;
    try {
      await sendPaymentFailedEmail(user.email, user.name, portalUrl);
    } catch (emailErr) {
      console.error('Payment action email failed (non-fatal):', emailErr.message);
    }
  } catch (error) {
    console.error('Error handling payment action required:', error);
    throw error;
  }
}

//deletting subscription webhook handler
const handleSubscriptionDeleted = async (subscription) => {
  try {
    const existingSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id
    });
    if (!existingSubscription) {
      console.log('Subscription not found in database');
      return;
    }
    existingSubscription.status = 'canceled';
    await existingSubscription.save();
    console.log(`Subscription canceled for user: ${existingSubscription.userId}`);
    const user = await User.findById(existingSubscription.userId);
    if (user) {
      try {
        await sendCancellationEmail(user.email, user.name);
      } catch (emailErr) {
        console.error('Cancellation email failed (non-fatal):', emailErr.message);
      }
    }
} catch (error) {
    console.error('Error handling subscription deletion:', error);
    throw error;
  }
}

// Handle subscription renewal (invoice.paid)
const handleInvoicePaid = async (invoice) => {
  try {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return;

    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const itemId = stripeSubscription.items.data[0].id;

    const subscription = await Subscription.findOne({
      stripeSubscriptionId: subscriptionId
    });
    if (!subscription) {
      console.error('Subscription not found for renewal:', subscriptionId);
      return;
    }

    const periodStart = stripeSubscription.items.data[0].current_period_start ?? stripeSubscription.current_period_start;
    const periodEnd = stripeSubscription.items.data[0].current_period_end ?? stripeSubscription.current_period_end;

    subscription.status = stripeSubscription.status;
    subscription.stripeSubscriptionItemId = itemId;
    if (periodStart) subscription.currentPeriodStart = new Date(periodStart * 1000);
    if (periodEnd) subscription.currentPeriodEnd = new Date(periodEnd * 1000);
    subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
    await subscription.save();

    console.log(` Subscription renewed for: ${subscriptionId}`);
    console.log(`   New period end: ${subscription.currentPeriodEnd}`);
  } catch (error) {
    console.error('Error handling invoice.paid:', error);
    throw error;
  }
}

// Handle subscription updates (plan changes, trial end, status changes)
const handleSubscriptionUpdated = async (stripeSubscription) => {
  try {
    const subscriptionId = stripeSubscription.id;
    const itemId = stripeSubscription.items.data[0].id;

    const subscription = await Subscription.findOne({
      stripeSubscriptionId: subscriptionId
    });
    if (!subscription) {
      console.error('Subscription not found for update:', subscriptionId);
      return;
    }

    // Determine plan from price ID (product metadata is authoritative, price metadata is fallback)
    const priceId = stripeSubscription.items.data[0].price.id;
    let plan = subscription.plan;
    try {
      const price = await stripe.prices.retrieve(priceId);
      const product = await stripe.products.retrieve(price.product);
      if (product.metadata?.plan) {
        plan = product.metadata.plan;
      } else if (price.metadata?.plan) {
        plan = price.metadata.plan;
      }
    } catch (e) {
      console.log('Could not determine plan from price, keeping existing:', plan);
    }

    const periodStart = stripeSubscription.items.data[0].current_period_start ?? stripeSubscription.current_period_start;
    const periodEnd = stripeSubscription.items.data[0].current_period_end ?? stripeSubscription.current_period_end;
    const trialEnd = stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null;

    subscription.plan = plan;
    subscription.status = stripeSubscription.status;
    subscription.stripeSubscriptionItemId = itemId;
    subscription.stripePriceId = stripeSubscription.items.data[0].price.id;
    if (periodStart) subscription.currentPeriodStart = new Date(periodStart * 1000);
    if (periodEnd) subscription.currentPeriodEnd = new Date(periodEnd * 1000);
    subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
    if (trialEnd) subscription.trialEnd = trialEnd;
    await subscription.save();

    console.log(` Subscription updated: ${subscriptionId}`);
    console.log(`   Plan: ${plan}, Status: ${stripeSubscription.status}, Cancel at period end: ${stripeSubscription.cancel_at_period_end}`);
  } catch (error) {
    console.error('Error handling subscription.updated:', error);
    throw error;
  }
}

// Handle trial ending soon notification
const handleTrialWillEnd = async (stripeSubscription) => {
  try {
    const subscriptionId = stripeSubscription.id;
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: subscriptionId
    });
    if (!subscription) {
      console.error('Subscription not found for trial ending:', subscriptionId);
      return;
    }

    const user = await User.findById(subscription.userId);
    if (!user) return;

    const trialEnd = stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null;
    const daysLeft = trialEnd ? Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24)) : 0;

    console.log(` Trial ending soon for user: ${user.email}, Days left: ${daysLeft}`);

    try {
      await sendTrialEndingEmail(user.email, user.name, daysLeft);
    } catch (emailErr) {
      console.error('Trial ending email failed (non-fatal):', emailErr.message);
    }
  } catch (error) {
    console.error('Error handling trial_will_end:', error);
    throw error;
  }
}

//receives all Stripe webhook events
const handleWebhook = async (req, res) => {

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  //IDEMPOTENCY
  const eventId = event.id;
  const alreadyProcessed = await ProcessedEvent.findOne({ eventId });

  if (alreadyProcessed) {
    console.log(`Webhook ${eventId} already processed (${event.type})`);
    return res.status(200).json({ received: true, alreadyProcessed: true });
  }
    let processed = false;
    

  try {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      processed = true;
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      processed = true;
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      processed = true;
      break;
    case 'customer.subscription.trial_will_end':
      await handleTrialWillEnd(event.data.object);
      processed = true;
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      processed = true;
      break;
    case 'customer.subscription.created':
      console.log('Subscription created:', event.data.object.id);
      processed = true;
      break;
    case 'payment_intent.succeeded':
      console.log('Payment succeeded:', event.data.object.id);
      processed = true;
      break;
    case 'charge.succeeded':
      console.log('Charge succeeded:', event.data.object.id);
      processed = true;
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      processed = true;
      break;
    case 'invoice.payment_action_required':
      await handlePaymentActionRequired(event.data.object);
      processed = true;
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Failed to process webhook' });
  }
   if (processed) {
    try {
      await ProcessedEvent.create({
        eventId: eventId,
        eventType: event.type,
      });
      console.log(`Webhook ${eventId} processed and saved (${event.type})`);
    } catch (error) {
      console.error('Error saving processed event:', error);
      // Don't throw - we still return 200 to Stripe
    }
  }

  res.status(200).json({ received: true });
};
module.exports = {
  handleWebhook,
};
