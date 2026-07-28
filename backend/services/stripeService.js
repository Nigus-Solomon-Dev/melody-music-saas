const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createCustomer = async ({ email, name }) => {
  try {
    const customer = await stripe.customers.create({
      email: email,
      name: name,
    });
    return customer;
  } catch (error) {
    console.error('Stripe Customer Creation Error:', error);
    throw error;

  }
}

//check out session
const createCheckoutSession = async ({ customerId, priceId, successUrl, cancelUrl, metadata }) => {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: metadata || {},
    });
    return session;
  } catch (error) {
    console.error('Stripe Checkout Session Error:', error);
    throw error;
  }
}
const createPortalSession = async ({ customerId, returnUrl }) => {
  try {
    const session = stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session;
  } catch (error) {
    console.error('Stripe Portal Session Error:', error);
    throw error;
  }
}

module.exports = {
  createCustomer,
  createCheckoutSession,
  createPortalSession
};