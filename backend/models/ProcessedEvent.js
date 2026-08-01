const mongoose = require('mongoose');
const ProcessedEventSchema = new mongoose.Schema({
      eventId: {
        type: String,
        required: true,
        unique: true, // ← Prevents duplicates
    },
    eventType: {
        type: String,
        required: true,
    },
     processedAt: {
        type: Date,
        default: Date.now,
    },
});
ProcessedEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
const ProcessedEvent = mongoose.model('ProcessedEvent', ProcessedEventSchema);

module.exports = ProcessedEvent;
