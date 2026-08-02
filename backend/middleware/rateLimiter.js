const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
   },
   standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable deprecated headers
});

//stict Rate limiter
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: {
        success: false,
        message: 'Too many attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    limiter,
    strictLimiter,
};