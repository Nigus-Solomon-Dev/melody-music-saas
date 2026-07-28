const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    stripeSubscriptionId: {
        type: String,
        required: true,
        unique: true,
    },
    stripeCustomerId: {
        type: String,
        required: true,
    },
    plan: {
        type: String,
        enum: ['basic', 'pro', 'enterprise'],
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired'],
        default: 'active',
    },
    currentPeriodStart: {
        type: Date,
        required: true,
    },
    currentPeriodEnd: {
        type: Date,
        required: true,
    },
    cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

SubscriptionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
});

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

module.exports = Subscription;