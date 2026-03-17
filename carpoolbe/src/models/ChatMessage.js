const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['text', 'image', 'system'],
            default: 'text',
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'seen'],
            default: 'sent',
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

chatMessageSchema.index({ booking: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
