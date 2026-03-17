const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            unique: true,
            sparse: true,
        },
        password: {
            type: String,
            required: true,
            select: false, // Don't return password in queries by default
        },
        role: {
            type: String,
            enum: ['rider', 'driver', 'both'],
            default: 'rider',
        },
        verified: {
            type: Boolean,
            default: false,
        },
        ratings: {
            average: { type: Number, default: 0, min: 0, max: 5 },
            count: { type: Number, default: 0 },
        },
        profilePhoto: {
            type: String, // URL to image
        },
        lastLogin: {
            type: Date,
            default: Date.now,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        vehicle: {
            make: { type: String, trim: true },
            model: { type: String, trim: true },
            year: { type: Number, min: 1990 },
            color: { type: String, trim: true },
            plateNumber: { type: String, trim: true },
            seats: { type: Number, min: 2, max: 9, default: 4 },
            fuelType: {
                type: String,
                enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng'],
                default: 'petrol',
            },
        },
        stripeCustomerId: {
            type: String,
        },
        preferences: {
            music: { type: String, enum: ['any', 'quiet', 'pop', 'rock', 'classical', 'podcast'], default: 'any' },
            smoking: { type: Boolean, default: false },
            pets: { type: Boolean, default: false },
            notifications: {
                email: { type: Boolean, default: true },
                push: { type: Boolean, default: true },
                sms: { type: Boolean, default: false },
            }
        },
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: { createdAt: 'joinedAt', updatedAt: true }, // joinedAt will act as createdAt
    }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes (Mongoose automatically builds them based on the unique: true fields above)

module.exports = mongoose.model('User', userSchema);
