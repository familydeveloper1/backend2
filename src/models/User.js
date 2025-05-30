const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lütfen isim giriniz'],
    trim: true,
    maxlength: [50, 'İsim 50 karakterden uzun olamaz']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Lütfen telefon numarası giriniz'],
    unique: true,
    match: [
      /^[0-9]{10,15}$/,
      'Lütfen geçerli bir telefon numarası giriniz (10-15 rakam)'
    ]
  },
  password: {
    type: String,
    required: [true, 'Lütfen şifre giriniz'],
    minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
    select: false
  },
  // Telefon numarası tabanlı sistemde cihaz referansına gerek yok
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Telefon numarası tabanlı sistem için son konum bilgisi
  lastKnownLocation: {
    latitude: {
      type: Number,
      default: 0
    },
    longitude: {
      type: Number,
      default: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Şifreyi hashleme
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// JWT token oluşturma
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Şifre karşılaştırma
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
