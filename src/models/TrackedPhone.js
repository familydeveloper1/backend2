const mongoose = require('mongoose');

const trackedPhoneSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: false,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date
  }
}, {
  timestamps: true
});

// Aynı kullanıcının aynı telefon numarasını birden fazla kez takip etmesini önle
trackedPhoneSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });

const TrackedPhone = mongoose.model('TrackedPhone', trackedPhoneSchema);

module.exports = TrackedPhone;
