const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const { protect } = require('./middleware/auth');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const musicRoutes = require('./routes/musicRoutes');
const { limiter, strictLimiter } = require('./middleware/rateLimiter');
const app= express();
const PORT=process.env.PORT;

app.use(cors({
  origin:'http://localhost:3000',
  credentials:true
}))

// Stripe webhooks need the raw body for signature verification — must come before express.json()
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use((req, res, next) => {
    const skipPaths = ['/api/auth/signup', '/api/auth/login', '/api/subscription/create'];
    if (skipPaths.some(path => req.path.startsWith(path))) {
        return next(); // Skip general limiter
    }
    return limiter(req, res, next);
});
app.get('/', (req,res)=>{
  res.json({
           message: 'SaaS Subscription Hub API',
        status: 'running',
        version: '1.0.0'
  })
})
app.use('/api/auth/signup', strictLimiter);
app.use('/api/auth/login', strictLimiter);
app.use('/api/subscription/create', strictLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/music', musicRoutes);



app.use('/api/webhooks', webhookRoutes);
app.get('/api/protected', protect, (req, res) => {
    res.json({
        success: true,
        message: 'You have access to this protected route!',
        data: { user: req.user },
    });
});


//conecting to database
mongoose.connect(process.env.MONGODB_URI)
.then(()=>console.log('mongoDB connected'))
.catch(err=>console.error('mongoDB error:',err));



app.listen(PORT,()=>{
  console.log(`listening in port${PORT}`);
  
})