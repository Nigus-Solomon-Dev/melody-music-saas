const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Subscription = require('../models/Subscription');
const ProcessedEvent = require('../models/ProcessedEvent');

const cleanupDatabase = async () => {
    try {
        console.log('🧹 Starting Database Cleanup...');
        console.log('====================================');

        console.log('\n📊 ProcessedEvent Collection:');
        const oldEvents = await ProcessedEvent.deleteMany({
            processedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });
        console.log(`   ✅ Deleted ${oldEvents.deletedCount} old processed events`);

        console.log('\n📊 Subscription Collection:');
        const oldSubscriptions = await Subscription.deleteMany({
            createdAt: { $lt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
            $or: [
                { plan: 'test' },
                { plan: { $regex: /test/i } }
            ]
        });
        console.log(`   ✅ Deleted ${oldSubscriptions.deletedCount} test subscriptions`);

        console.log('\n📊 User Collection:');
        const testUsers = await User.deleteMany({
            email: { $regex: /test/i }
        });
        console.log(`   ✅ Deleted ${testUsers.deletedCount} test users`);

        console.log('\n====================================');
        console.log('✅ Database cleanup complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
        process.exit(1);
    }
};

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        return cleanupDatabase();
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });