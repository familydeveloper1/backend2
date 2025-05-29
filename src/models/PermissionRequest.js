const mongoose = require('mongoose');

const PermissionRequestSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: [true, 'Lütfen cihaz ID giriniz'],
    trim: true
  },
  requesterPhone: {
    type: String,
    required: [true, 'Lütfen telefon numarası giriniz'],
    trim: true
  },
  ownerUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PermissionRequest', PermissionRequestSchema);
