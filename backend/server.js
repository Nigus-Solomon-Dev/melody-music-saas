const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const { protect } = require('./middleware/auth');

const app= express();
const PORT=process.env.PORT;

app.use(cors({
  origin:'http://localhost:3000',
  credentials:true
}))

app.use(express.json());

app.get('/', (req,res)=>{
  res.json({
           message: 'SaaS Subscription Hub API',
        status: 'running',
        version: '1.0.0'
  })
})

app.use('/api/auth', authRoutes);
app.get('/api/protected', protect, (req, res) => {
    res.json({
        success: true,
        message: 'You have access to this protected route!',
        user: req.user,
    });
});


//conecting to database
mongoose.connect(process.env.MONGODB_URI)
.then(()=>console.log('mongoDB connected'))
.catch(err=>console.err('mongoDB error:',err));



app.listen(PORT,()=>{
  console.log(`listening in port${PORT}`);
  
})