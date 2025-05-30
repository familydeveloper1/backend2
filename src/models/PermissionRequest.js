const mongoose = require('mongoose');

const PermissionRequestSchema = new mongoose.Schema({
  targetPhoneNumber: {
    type: String,
    required: [true, 'Lütfen izin istenen telefon numarasını giriniz'],
    trim: true
  },
  requesterPhone: {
    type: String,
    required: [true, 'Lütfen telefon numarası giriniz'],
    trim: true
  },
  ownerPhoneNumber: {
    type: String,
    required: [true, 'Lütfen izin sahibi telefon numarasını giriniz'],
    trim: true
  },
  ownerUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Telefon numarası tabanlı sistemde kullanıcı referansı opsiyonel olabilir
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
