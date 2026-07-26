const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect=async (req,res,next)=>{
  try{
    const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login.',
            });
        }
        //verify token
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        //find user from token
        const user = await User.findById(decoded.userId).select('-password');
             if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }
        req.user = user;
        next();
  }catch (error) {
        console.error('Auth Error:', error);
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Invalid token.',
        });
    }
}
module.exports = { protect };