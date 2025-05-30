const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
// Auth middleware'ini import et

// Models
const Location = require('./models/Location');
const User = require('./models/User');

// Models
const AllowedNumber = require('./models/AllowedNumber');
const PermissionRequest = require('./models/PermissionRequest');

// Middleware
const { protect } = require('./middleware/auth');
const auth = protect;

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

// KULLANICI ROTALARI

// Kullanıcı kaydı
app.post('/api/users/register', async (req, res, next) => {
  try {
    console.log('Register endpoint çağrıldı');
    console.log('Request body:', req.body);
    
    const { name, phoneNumber, password } = req.body;

    // Gerekli alanları kontrol et
    if (!name || !phoneNumber || !password) {
      console.log('Eksik alanlar:', { name, phoneNumber, password: password ? 'Var' : 'Yok' });
      return next(new ErrorResponse('Lütfen tüm alanları doldurunuz', 400));
    }

    // Kullanıcı oluştur
    const user = await User.create({
      name,
      phoneNumber,
      password
    });

    console.log('Kullanıcı başarıyla oluşturuldu:', user._id);
    
    // Token oluştur
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Kayıt hatası:', err.message);
    next(err);
  }
});

// Kullanıcı girişi
app.post('/api/users/login', async (req, res, next) => {
  try {
    console.log('Login endpoint çağrıldı');
    console.log('Request body:', req.body);
    
    const { phoneNumber, password } = req.body;

    // Telefon numarası ve şifre kontrolü
    if (!phoneNumber || !password) {
      console.log('Eksik giriş bilgileri');
      return next(new ErrorResponse('Lütfen telefon numarası ve şifre giriniz', 400));
    }

    // Kullanıcıyı kontrol et
    const user = await User.findOne({ phoneNumber }).select('+password');

    if (!user) {
      console.log('Kullanıcı bulunamadı:', phoneNumber);
      return next(new ErrorResponse('Geçersiz kimlik bilgileri', 401));
    }

    // Şifre kontrolü
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log('Şifre eşleşmiyor:', phoneNumber);
      return next(new ErrorResponse('Geçersiz kimlik bilgileri', 401));
    }

    console.log('Kullanıcı girişi başarılı:', user._id);
    
    // Token oluştur
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Giriş hatası:', err.message);
    next(err);
  }
});

// Mevcut kullanıcı bilgilerini getir
app.get('/api/users/me', auth, async (req, res, next) => {
  try {
    console.log('GetMe endpoint çağrıldı, kullanıcı ID:', req.user.id);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('Kullanıcı bulunamadı:', req.user.id);
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
    }
    
    console.log('Kullanıcı bilgileri başarıyla getirildi');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('GetMe hatası:', err.message);
    next(err);
  }
});

// Kullanıcı bilgilerini güncelle
app.put('/api/users/me', auth, async (req, res, next) => {
  try {
    console.log('UpdateDetails endpoint çağrıldı, kullanıcı ID:', req.user.id);
    console.log('Güncellenecek alanlar:', req.body);
    
    const fieldsToUpdate = {
      name: req.body.name,
      phoneNumber: req.body.phoneNumber
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    if (!user) {
      console.log('Kullanıcı bulunamadı:', req.user.id);
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
    }

    console.log('Kullanıcı bilgileri başarıyla güncellendi');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('UpdateDetails hatası:', err.message);
    next(err);
  }
});

// Şifre güncelle
app.put('/api/users/updatepassword', auth, async (req, res, next) => {
  try {
    console.log('UpdatePassword endpoint çağrıldı, kullanıcı ID:', req.user.id);
    
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      console.log('Kullanıcı bulunamadı:', req.user.id);
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
    }

    // Mevcut şifreyi kontrol et
    if (!(await user.matchPassword(req.body.currentPassword))) {
      console.log('Mevcut şifre eşleşmiyor');
      return next(new ErrorResponse('Mevcut şifre yanlış', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    console.log('Kullanıcı şifresi başarıyla güncellendi');
    
    // Token oluştur
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (err) {
    console.error('UpdatePassword hatası:', err.message);
    next(err);
  }
});

// İZİN ROTALARI

// İzin verilen numaraları getir
app.get('/api/permissions/allowed-numbers', auth, async (req, res, next) => {
  try {
    const allowedNumbers = await AllowedNumber.find({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: allowedNumbers.length,
      data: allowedNumbers
    });
  } catch (err) {
    next(err);
  }
});

// İzin verilen numara ekle
app.post('/api/permissions/allowed-numbers', auth, async (req, res, next) => {
  try {
    // Kullanıcı ID'sini ekle
    req.body.user = req.user.id;

    // Telefon numarası zaten eklenmiş mi kontrol et
    const existingNumber = await AllowedNumber.findOne({
      user: req.user.id,
      phoneNumber: req.body.phoneNumber
    });

    if (existingNumber) {
      return next(new ErrorResponse('Bu telefon numarası zaten izin verilenler listesinde', 400));
    }

    const allowedNumber = await AllowedNumber.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Telefon numarası başarıyla eklendi',
      data: allowedNumber
    });
  } catch (err) {
    next(err);
  }
});

// İzin verilen numara sil
app.delete('/api/permissions/allowed-numbers/:id', auth, async (req, res, next) => {
  try {
    const allowedNumber = await AllowedNumber.findById(req.params.id);

    if (!allowedNumber) {
      return next(new ErrorResponse(`${req.params.id} ID'li izin verilen numara bulunamadı`, 404));
    }

    // Numaranın kullanıcıya ait olup olmadığını kontrol et
    if (allowedNumber.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Bu numarayı silme yetkiniz yok', 403));
    }

    await allowedNumber.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Telefon numarası başarıyla silindi',
      data: {}
    });
  } catch (err) {
    next(err);
  }
});

// Telefon numarası için izin isteği gönder
app.post('/api/permissions/request', auth, async (req, res, next) => {
  try {
    const { targetPhoneNumber, requesterPhone } = req.body;

    // Hedef telefon numarasının sahibini bul
    const owner = await User.findOne({ phoneNumber: targetPhoneNumber });

    if (!owner) {
      return next(new ErrorResponse(`${targetPhoneNumber} numaralı kullanıcı bulunamadı`, 404));
    }

    // İzin isteği zaten var mı kontrol et
    const existingRequest = await PermissionRequest.findOne({
      targetPhoneNumber,
      requesterPhone,
      status: 'pending'
    });

    if (existingRequest) {
      return next(new ErrorResponse('Bu telefon numarası için zaten bir izin isteğiniz var', 400));
    }

    // Yeni izin isteği oluştur
    const permissionRequest = await PermissionRequest.create({
      targetPhoneNumber,
      requesterPhone,
      ownerPhoneNumber: targetPhoneNumber,
      ownerUser: owner._id
    });

    res.status(201).json({
      success: true,
      message: 'İzin isteği başarıyla gönderildi',
      data: permissionRequest
    });
  } catch (err) {
    next(err);
  }
});

// İzin isteklerini getir
app.get('/api/permissions/requests', auth, async (req, res, next) => {
  try {
    // Telefon numarası tabanlı sistem için güncellendi
    const permissionRequests = await PermissionRequest.find({ 
      $or: [
        { ownerUser: req.user.id },
        { ownerPhoneNumber: req.user.phoneNumber }
      ]
    });

    res.status(200).json({
      success: true,
      count: permissionRequests.length,
      data: permissionRequests
    });
  } catch (err) {
    next(err);
  }
});

// İzin isteğini yanıtla
app.put('/api/permissions/request/:id', auth, async (req, res, next) => {
  try {
    const { accept } = req.body;

    const permissionRequest = await PermissionRequest.findById(req.params.id);

    if (!permissionRequest) {
      return next(new ErrorResponse(`${req.params.id} ID'li izin isteği bulunamadı`, 404));
    }

    // İsteğin kullanıcıya ait olup olmadığını kontrol et - telefon numarası tabanlı sistem için güncellendi
    if (permissionRequest.ownerPhoneNumber !== req.user.phoneNumber && 
        (!permissionRequest.ownerUser || permissionRequest.ownerUser.toString() !== req.user.id)) {
      return next(new ErrorResponse('Bu isteği yanıtlama yetkiniz yok', 403));
    }

    // İsteği güncelle
    permissionRequest.status = accept ? 'accepted' : 'rejected';
    await permissionRequest.save();

    res.status(200).json({
      success: true,
      message: accept ? 'İzin isteği kabul edildi' : 'İzin isteği reddedildi',
      data: permissionRequest
    });
  } catch (err) {
    next(err);
  }
});

// Bir telefon numarasını takip etmek için izin durumunu kontrol et
app.get('/api/permissions/check/phone/:phoneNumber', auth, async (req, res, next) => {
  try {
    const { phoneNumber } = req.params;

    // Hedef telefon numarasının sahibini bul
    const targetUser = await User.findOne({ phoneNumber });

    if (!targetUser) {
      return next(new ErrorResponse(`${phoneNumber} numaralı kullanıcı bulunamadı`, 404));
    }

    // Kullanıcı kendisi mi kontrol et?
    if (req.user.phoneNumber === phoneNumber) {
      return res.status(200).json({
        success: true,
        hasPermission: true,
        message: 'Bu telefon numarası size ait'
      });
    }

    // Kullanıcının telefon numarası izin verilen numaralar listesinde mi?
    const allowedNumber = await AllowedNumber.findOne({
      user: targetUser._id,
      phoneNumber: req.user.phoneNumber
    });

    if (allowedNumber) {
      return res.status(200).json({
        success: true,
        hasPermission: true,
        message: 'Bu kullanıcıyı takip etme izniniz var'
      });
    }

    // İzin isteği kabul edilmiş mi?
    const acceptedRequest = await PermissionRequest.findOne({
      targetPhoneNumber: phoneNumber,
      requesterPhone: req.user.phoneNumber,
      status: 'accepted'
    });

    if (acceptedRequest) {
      return res.status(200).json({
        success: true,
        hasPermission: true,
        message: 'İzin isteğiniz kabul edildi'
      });
    }

    return res.status(200).json({
      success: true,
      hasPermission: false,
      message: 'Bu kullanıcıyı takip etme izniniz yok'
    });
  } catch (err) {
    next(err);
  }
});

// Konum rotalarını doğrudan server.js içinde tanımlıyoruz

// Telefon numarasına göre konum kaydetme
app.post('/api/locations/phone', auth, async (req, res) => {
  try {
    console.log('Konum kaydetme isteği alındı:', req.body);
    const { phoneNumber, latitude, longitude, altitude, speed, accuracy, userId, heading, timestamp } = req.body;

    if (!phoneNumber || !latitude || !longitude) {
      console.error('Eksik konum bilgileri:', { phoneNumber, latitude, longitude });
      return res.status(400).json({
        success: false,
        error: 'Eksik konum bilgileri'
      });
    }

    // Telefon numarasını kontrol et
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      console.error(`${phoneNumber} numaralı kullanıcı bulunamadı`);
      return res.status(404).json({
        success: false,
        error: `${phoneNumber} numaralı kullanıcı bulunamadı`
      });
    }

    console.log('Kullanıcı bulundu:', user._id);

    // Konum oluştur
    const locationData = {
      phoneNumber,
      user: user._id,
      coordinates: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      timestamp: timestamp || Date.now()
    };

    // Opsiyonel alanları ekle
    if (altitude !== undefined) locationData.altitude = altitude;
    if (speed !== undefined) locationData.speed = speed;
    if (accuracy !== undefined) locationData.accuracy = accuracy;
    if (heading !== undefined) locationData.heading = heading;

    console.log('Kaydedilecek konum verileri:', locationData);

    // Konum oluştur
    const location = await Location.create(locationData);
    console.log('Konum başarıyla kaydedildi:', location._id);

    // Kullanıcının son konum bilgisini güncelle
    user.lastKnownLocation = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    await user.save();
    console.log('Kullanıcının son konum bilgisi güncellendi');

    res.status(201).json({
      success: true,
      data: location
    });
  } catch (err) {
    console.error('Konum kaydedilirken hata:', err);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası: ' + err.message
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
