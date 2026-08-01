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
};

const createCheckoutSession = async ({ customerId, priceId, successUrl, cancelUrl, metadata, trialDays }) => {
    try {
        // Build the session data
        const sessionData = {
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: metadata || {},
            customer: customerId,
        };

        // Add trial if provided
        if (trialDays && trialDays > 0) {
            sessionData.subscription_data = {
                trial_period_days: trialDays,
            };
        }

        // Create the session ONCE
        const session = await stripe.checkout.sessions.create(sessionData);
        return session;

    } catch (error) {
        console.error('Stripe Checkout Session Error:', error);
        throw error;
    }
};
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