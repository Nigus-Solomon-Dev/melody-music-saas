const User = require('../models/User');
const Subscription = require('../models/Subscription');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {
  sendWelcomeEmail,
  sendPaymentFailedEmail,
  sendCancellationEmail
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
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
    //creating subscription in database
    await Subscription.create({
      userId: user._id,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      plan: plan,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      trialEnd: trialEnd,
      cancelAtPeriodEnd: false,
    })
    await Subscription.create(subscriptionData);
    console.log(` Subscription saved for user: ${user.email}`);
    console.log(`   Plan: ${plan}`);
    console.log(`   Status: ${subscriptionData.status}`);
    if (trialEnd) {
      console.log(`   Trial ends: ${trialEnd}`);
    } await sendWelcomeEmail(user.email, user.name, plan);
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
    await sendPaymentFailedEmail(user.email, user.name, portalUrl);
  } catch (error) {
    console.error('Error handling payment failure:', error);
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
      await sendCancellationEmail(user.email, user.name);
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
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
      console.log('Invoice paid:', event.data.object.id);
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
