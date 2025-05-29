const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
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
  }
});

// Konum verilerini kaydetmeden önce
LocationSchema.pre('save', async function(next) {
  // Eğer bu yeni bir konum ise, cihazın son konumunu güncelle
  if (this.isNew) {
    try {
      const Device = mongoose.model('Device');
      await Device.findByIdAndUpdate(this.device, {
        lastLocation: this._id
      });
    } catch (err) {
      console.error('Cihazın son konumu güncellenirken hata oluştu:', err);
    }
  }
  next();
});

module.exports = mongoose.model('Location', LocationSchema);
