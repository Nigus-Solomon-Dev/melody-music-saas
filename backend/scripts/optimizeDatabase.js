// backend/scripts/optimizeDatabase.js
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Subscription = require('../models/Subscription');
const ProcessedEvent = require('../models/ProcessedEvent');

const optimizeDatabase = async () => {
    try {
        console.log('🚀 Starting Database Optimization...');
        console.log('====================================');

        console.log('\n📊 User Collection:');
        console.log('   ✅ Email index already exists');

        await User.collection.createIndex(
            { stripeCustomerId: 1 },
            { background: true, name: 'idx_user_stripeCustomerId' }
        );
        console.log('   ✅ stripeCustomerId index created');

        console.log('\n📊 Subscription Collection:');

        await Subscription.collection.createIndex(
            { userId: 1 },
            { background: true, name: 'idx_sub_userId' }
        );
        console.log('   ✅ userId index created');

        console.log('   ✅ stripeSubscriptionId index already exists');

        await Subscription.collection.createIndex(
            { stripeSubscriptionItemId: 1 },
            { background: true, name: 'idx_sub_itemId' }
        );
        console.log('   ✅ stripeSubscriptionItemId index created');

        await Subscription.collection.createIndex(
            { userId: 1, status: 1 },
            { background: true, name: 'idx_sub_user_status' }
        );
        console.log('   ✅ userId + status compound index created');

        console.log('\n📊 ProcessedEvent Collection:');

        console.log('   ✅ eventId index already exists');

        // ============================================
        // FIX: Drop existing processedAt index first
        // ============================================
        const existingIndexes = await ProcessedEvent.collection.indexes();
        const processedAtIndex = existingIndexes.find(idx => 
            idx.key && idx.key.processedAt !== undefined && idx.name !== '_id_'
        );

        if (processedAtIndex) {
            await ProcessedEvent.collection.dropIndex(processedAtIndex.name);
            console.log(`   🔄 Dropped old index: ${processedAtIndex.name}`);
        }

        await ProcessedEvent.collection.createIndex(
            { processedAt: 1 },
            { 
                expireAfterSeconds: 60 * 60 * 24 * 30,
                background: true,
                name: 'idx_event_processedAt_ttl'
            }
        );
        console.log('   ✅ TTL index on processedAt created (30 days)');

        console.log('\n====================================');
        console.log('\n📋 All indexes now exist:');
        
        const userIndexes = await User.collection.indexes();
        const subIndexes = await Subscription.collection.indexes();
        const eventIndexes = await ProcessedEvent.collection.indexes();

        console.log('\nUser Collection Indexes:');
        userIndexes.forEach(idx => console.log(`   - ${idx.name}`));

        console.log('\nSubscription Collection Indexes:');
        subIndexes.forEach(idx => console.log(`   - ${idx.name}`));

        console.log('\nProcessedEvent Collection Indexes:');
        eventIndexes.forEach(idx => console.log(`   - ${idx.name}`));

        console.log('\n✅ Database optimization complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Optimization failed:', error.message);
        process.exit(1);
    }
};

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        return optimizeDatabase();
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });