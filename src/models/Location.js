const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  // Telefon numarası tabanlı sistem için eklendi
  phoneNumber: {
    type: String,
    required: false, // Geriye dönük uyumluluk için false
    index: true, // Telefon numarasına göre hızlı arama için indeks
    unique: true // Her telefon numarası için tek kayıt olmasını sağlar
  },
  // Kullanıcı referansı
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Geriye dönük uyumluluk için false
  },
  // Telefon numarası tabanlı sistemde cihaz referansına gerek yok
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      // [longitude, latitude]
      index: '2dsphere'
    }
  },
  altitude: {
    type: Number,
    default: 0
  },
  speed: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0
  },
  address: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Son güncelleme zamanı
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Konum verilerini kaydetmeden önce
LocationSchema.pre('save', async function(next) {
  
  // Eğer bu yeni bir konum ise ve bir telefon numarası varsa, kullanıcının son konumunu güncelle
  if (this.isNew && this.phoneNumber) {
    try {
      const User = mongoose.model('User');
      const user = await User.findOne({ phoneNumber: this.phoneNumber });
      if (user) {
        user.lastKnownLocation = {
          latitude: this.coordinates.coordinates[1],
          longitude: this.coordinates.coordinates[0],
          timestamp: this.timestamp
        };
        await user.save();
      }
    } catch (err) {
      console.error('Kullanıcının son konumu güncellenirken hata oluştu:', err);
    }
  }
  
  next();
});

// findOneAndUpdate için hook - kullanıcının son konumunu güncelle
LocationSchema.pre('findOneAndUpdate', async function(next) {
  try {
    const update = this.getUpdate();
    const phoneNumber = update.phoneNumber;
    
    if (phoneNumber && update.coordinates) {
      const User = mongoose.model('User');
      const user = await User.findOne({ phoneNumber });
      
      if (user) {
        user.lastKnownLocation = {
          latitude: update.coordinates.coordinates[1],
          longitude: update.coordinates.coordinates[0],
          timestamp: update.timestamp || Date.now()
        };
        await user.save();
        console.log(`${phoneNumber} için kullanıcı son konumu güncellendi`);
      }
    }
  } catch (err) {
    console.error('findOneAndUpdate sırasında kullanıcı son konumu güncellenirken hata:', err);
  }
  
  next();
});

module.exports = mongoose.model('Location', LocationSchema);
