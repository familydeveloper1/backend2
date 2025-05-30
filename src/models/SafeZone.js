const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const safeZoneSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  radius: {
    type: Number,
    required: true,
    min: 50,    // Minimum 50 metre
    max: 5000   // Maximum 5 kilometre
  },
  category: {
    type: String,
    enum: ['Home', 'Work', 'School', 'Shopping', 'Other'],
    default: 'Other'
  },
  color: {
    type: String,
    default: '#007AFF'  // Varsayılan mavi renk
  },
  active: {
    type: Boolean,
    default: true
  },
  entryEvents: [{
    timestamp: Date,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]  // [longitude, latitude]
    }
  }],
  exitEvents: [{
    timestamp: Date,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]  // [longitude, latitude]
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Konum bazlı sorgular için indeks oluştur
safeZoneSchema.index({ coordinates: '2dsphere' });

// Güncelleme zamanını otomatik güncelle
safeZoneSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Bir konumun güvenli bölge içinde olup olmadığını kontrol eden metod
safeZoneSchema.methods.isInside = function(longitude, latitude) {
  const earthRadius = 6371000; // Dünya yarıçapı (metre)
  
  // Haversine formülü ile iki nokta arasındaki mesafeyi hesapla
  const zoneLng = this.coordinates.coordinates[0];
  const zoneLat = this.coordinates.coordinates[1];
  
  const dLat = (latitude - zoneLat) * Math.PI / 180;
  const dLng = (longitude - zoneLng) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(zoneLat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = earthRadius * c;
  
  return distance <= this.radius;
};

const SafeZone = mongoose.model('SafeZone', safeZoneSchema);

module.exports = SafeZone;
