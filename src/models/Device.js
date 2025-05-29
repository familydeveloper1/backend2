const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: [true, 'Lütfen cihaz ID giriniz'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Lütfen cihaz adı giriniz'],
    trim: true,
    maxlength: [50, 'Cihaz adı 50 karakterden uzun olamaz']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Cihaza ait konumları getir (virtual)
DeviceSchema.virtual('locations', {
  ref: 'Location',
  localField: '_id',
  foreignField: 'device',
  justOne: false
});

module.exports = mongoose.model('Device', DeviceSchema);
