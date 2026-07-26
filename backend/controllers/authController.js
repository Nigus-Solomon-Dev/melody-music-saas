const User = require('../models/User');
const { createCustomer } = require('../services/stripeService');
const jwt = require('jsonwebtoken');

const signup = async (req, res) => {
  try {
    console.log("am in signup");

    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, name, and password'
      });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    const user = await User.create({
      email,
      name,
      password
    });
    //registers the user in Stripe and gets a customer ID
    const customer = await createCustomer({
      email: email,
      name: name
    })
    //Save Stripe Customer ID to user record
    user.stripeCustomerId = customer.id;
    await user.save();

    //generating token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    //Return success response with user data and token
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          stripeCustomerId: user.stripeCustomerId,
        },
        token: token,
      }
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during signup',
      error: error.message,
    });
  }
}

//login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    stripeCustomerId: user.stripeCustomerId,
                },
                token: token,
            }
        });
  } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message,
        });
  }
}
module.exports = {
  signup,
  login
};
