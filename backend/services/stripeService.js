const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createCustomer=async ({ email, name })=>{
  try{
    const customer =await stripe.customers.create({
      email:email,
      name:name,
    });
    return customer;
  }catch(error){
    console.error('Stripe Customer Creation Error:', error);
    throw error;
    
  }
}
module.exports = {
    createCustomer,
};