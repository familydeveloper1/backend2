const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const auth = require('./middleware/auth');

// Models
const Location = require('./models/Location');
const User = require('./models/User');

// Route imports - sadece kullanıcı ve izin rotalarını import ediyoruz
const userRoutes = require('./routes/userRoutes');
const permissionRoutes = require('./routes/permissionRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: '*', // Tüm originlere izin ver (geliştirme için)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request body parsing middleware
app.use(bodyParser.json());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Kullanıcı ve izin rotaları
app.use('/api/users', userRoutes);
app.use('/api/permissions', permissionRoutes);

// Konum rotalarını doğrudan server.js içinde tanımlıyoruz

// Telefon numarasına göre konum kaydetme
app.post('/api/locations/phone', auth, async (req, res) => {
  try {
    const { phoneNumber, latitude, longitude, altitude, speed, accuracy } = req.body;

    // Telefon numarasını kontrol et
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: `${phoneNumber} numaralı kullanıcı bulunamadı`
      });
    }

    // Konum oluştur
    const location = await Location.create({
      phoneNumber,
      user: user._id,
      coordinates: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      altitude,
      speed,
      accuracy
    });

    res.status(201).json({
      success: true,
      data: location
    });
  } catch (err) {
    console.error('Konum kaydedilirken hata:', err);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Telefon numarasına göre son konumu getir
app.get('/api/locations/phone/:phoneNumber/latest', auth, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    // Telefon numarasının sahibini kontrol et
    const targetUser = await User.findOne({ phoneNumber });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: `${phoneNumber} numaralı kullanıcı bulunamadı`
      });
    }

    // İzin kontrolü - kullanıcı kendisi mi veya admin mi?
    if (req.user.phoneNumber !== phoneNumber && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Bu telefon numarasının konumuna erişim yetkiniz yok'
      });
    }

    // Son konumu kullanıcı modelinden al
    if (!targetUser.lastKnownLocation) {
      return res.status(404).json({
        success: false,
        error: 'Bu telefon numarası için konum bilgisi bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        coordinates: {
          type: 'Point',
          coordinates: [targetUser.lastKnownLocation.longitude, targetUser.lastKnownLocation.latitude]
        },
        timestamp: targetUser.lastKnownLocation.timestamp
      }
    });
  } catch (err) {
    console.error('Son konum getirilirken hata:', err);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Telefon numarasına göre konum geçmişini getir
app.get('/api/locations/phone/:phoneNumber', auth, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    // İzin kontrolü - kullanıcı kendisi mi veya admin mi?
    if (req.user.phoneNumber !== phoneNumber && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Bu telefon numarasının konumlarına erişim yetkiniz yok'
      });
    }

    // Sorgu parametrelerini al
    const { limit = 100, startDate, endDate } = req.query;

    // Tarih filtresi oluştur
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else if (startDate) {
      dateFilter = {
        timestamp: { $gte: new Date(startDate) }
      };
    } else if (endDate) {
      dateFilter = {
        timestamp: { $lte: new Date(endDate) }
      };
    }

    // Telefon numarasına ait konumları getir
    const locations = await Location.find({
      phoneNumber,
      ...dateFilter
    })
      .sort('-timestamp')
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (err) {
    console.error('Konum geçmişi getirilirken hata:', err);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Yakındaki kullanıcıları bul
app.get('/api/locations/nearby', auth, async (req, res) => {
  try {
    const { latitude, longitude, distance = 10000 } = req.query; // Mesafe metre cinsinden

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Lütfen konum bilgisi giriniz (latitude, longitude)'
      });
    }

    // Yakındaki konumları bul
    const locations = await Location.find({
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(distance)
        }
      }
    }).populate('user');

    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (err) {
    console.error('Yakındaki kullanıcılar bulunurken hata:', err);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// Ana sayfa route'u
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'GPS Tracker Pro API çalışıyor',
    version: '1.0.0'
  });
});

// Test endpoint to verify API is working
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API test endpoint çalışıyor',
    timestamp: new Date().toISOString()
  });
});

// 404 - Route bulunamadı
app.use((req, res, next) => {
  console.log(`404 - Route bulunamadı: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Sayfa bulunamadı'
  });
});

// Error handler
app.use(errorHandler);

// Port dinleme
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
  
  // Yerel ortamda ise URL'leri göster
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Ana sayfa: http://localhost:${PORT}`);
    console.log(`API test: http://localhost:${PORT}/api/test`);
    console.log(`Kullanıcı kaydı: http://localhost:${PORT}/api/users/register`);
  } else {
    console.log('Uygulama production modunda çalışıyor');
  }
});

// Beklenmeyen hataları yakala
process.on('unhandledRejection', (err, promise) => {
  console.log(`Hata: ${err.message}`);
  console.log(err.stack);
  // Sunucuyu kapat ve process'i sonlandır
  server.close(() => process.exit(1));
});

module.exports = app;
