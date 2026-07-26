const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    // Basic info
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    
    // Stripe integration
    stripeCustomerId: {
        type: String,
        unique: true,
        sparse: true, // Allows null values but enforces uniqueness if set
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

UserSchema.pre('save',async function(next){
  if (!this.isModified('password'))return ;
  try{
    const salt= await bcrypt.genSalt(10);
    this.password=await bcrypt.hash(this.password,salt);
  }catch (error){
    throw error;
  }
})

UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
const User= mongoose.model('User',UserSchema);
module.exports=User;