const mongoose = require('mongoose');

const AllowedNumberSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: [true, 'Lütfen telefon numarası giriniz'],
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Model oluşturulmadan önce index ekle
AllowedNumberSchema.index({ user: 1, phoneNumber: 1 }, { unique: true });

// Veritabanında 'allowednumbers' koleksiyonunu kullan
module.exports = mongoose.model('AllowedNumber', AllowedNumberSchema, 'allowednumbers');
