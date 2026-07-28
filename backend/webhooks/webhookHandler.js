const User = require('../models/User');
const Subscription = require('../models/Subscription');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
//saves subscription to database
const handleCheckoutSessionCompleted = async (session) => {
  try {
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }
    //creating subscription in database
    await Subscription.create({
      userId: user._id,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      plan: session.metadata?.plan || 'basic',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    })
    console.log(`Subscription saved for user: ${user.email}`);
  } catch (error) {
    console.error('Error saving subscription:', error);
    throw error;
  }
}
//deletting subscription webhook handler
const handleSubscriptionDeleted = async (subscription) => {
  try {
    const existingSubscription = await subscription.findOne({
      stripeSubscriptionId: subscription.id
    });
    if (!existingSubscription) {
      console.log('Subscription not found in database');
      return;
    }
    existingSubscription.status = 'canceled';
    await existingSubscription.save();
    console.log(`Subscription canceled for user: ${existingSubscription.userId}`);
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


  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case 'invoice.paid':
      console.log('Invoice paid:', event.data.object.id);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'customer.subscription.created':
      console.log('Subscription created:', event.data.object.id);
      break;
    case 'payment_intent.succeeded':
      console.log('Payment succeeded:', event.data.object.id);
      break;
    case 'charge.succeeded':
      console.log('Charge succeeded:', event.data.object.id);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  res.status(200).json({ received: true });
}
module.exports = {
  handleWebhook,
};
