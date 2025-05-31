const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['walking', 'running', 'cycling', 'driving', 'other'],
    default: 'other'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  distance: {
    type: Number, // Distance in meters
    default: 0
  },
  calories: {
    type: Number,
    default: 0
  },
  avgSpeed: {
    type: Number, // Average speed in km/h
    default: 0
  },
  maxSpeed: {
    type: Number, // Maximum speed in km/h
    default: 0
  },
  locations: [{
    latitude: Number,
    longitude: Number,
    timestamp: Date,
    speed: Number,
    altitude: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'activities'
});

// Endeks oluşturma
activitySchema.index({ userId: 1, phoneNumber: 1, startTime: -1 });
activitySchema.index({ isActive: 1 });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
