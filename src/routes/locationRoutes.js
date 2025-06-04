const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const auth = protect;
const Location = require('../models/Location');
const User = require('../models/User');

// Telefon numarasına göre konum kaydetme
router.post('/phone', auth, async (req, res, next) => {
  try {
    const { phoneNumber, latitude, longitude, altitude, speed, accuracy, timestamp, limit = 20 } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Telefon numarası gerekli' });
    }
    
    let user = null;
    let userId = null;
    
    // Eğer anonim kullanıcı değilse kullanıcıyı bul
    if (phoneNumber !== 'anonymous') {
      user = await User.findOne({ phoneNumber });
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'Bu telefon numarasına sahip kullanıcı bulunamadı' });
      }
      
      userId = user._id;
    }

    // Mevcut konumu kontrol et ve güncelle, yoksa oluştur
    const locationData = {
      phoneNumber,
      user: userId, // Anonim kullanıcı için null olacak
      coordinates: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      altitude,
      speed,
      accuracy,
      timestamp: timestamp || Date.now(),
      updatedAt: Date.now()
    };
    
    // findOneAndUpdate ile mevcut kaydı güncelle, yoksa yeni kayıt oluştur
    const location = await Location.findOneAndUpdate(
      { phoneNumber }, // Arama kriteri
      locationData,    // Güncellenecek veriler
      { 
        new: true,     // Güncellenmiş veriyi döndür
        upsert: true,  // Kayıt yoksa oluştur
        setDefaultsOnInsert: true // Yeni kayıt oluşturulurken varsayılan değerleri ayarla
      }
    );
    
    // Limit kontrolüne gerek kalmadı, çünkü her telefon numarası için tek kayıt tutuyoruz

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
router.get('/phone/:phoneNumber/latest', auth, async (req, res, next) => {
  try {
    const { phoneNumber } = req.params;
    
    // Anonim kullanıcı kontrolü - anonim kullanıcılar için izin kontrolü yok
    if (phoneNumber !== 'anonymous') {
      // İzin kontrolü - kullanıcı kendisi mi veya admin mi?
      if (req.user.phoneNumber !== phoneNumber && req.user.role !== 'admin') {
        // Kullanıcı kendisi veya admin değilse, izin isteklerini kontrol et
        const PermissionRequest = require('../models/PermissionRequest');
        const permissionRequest = await PermissionRequest.findOne({
          targetPhoneNumber: phoneNumber,
          requesterPhone: req.user.phoneNumber,
          status: 'accepted'
        });

        if (!permissionRequest) {
          console.log(`${req.user.phoneNumber} kullanıcısının ${phoneNumber} numarasının konumuna erişim izni yok`);
          return res.status(403).json({
            success: false,
            error: 'Bu telefon numarasının konumuna erişim yetkiniz yok'
          });
        }
        
        console.log(`${req.user.phoneNumber} kullanıcısının ${phoneNumber} numarasının konumuna erişim izni var`);
      }
    }

    // Son konumu Location koleksiyonundan al (artık her telefon için tek kayıt var)
    const lastLocation = await Location.findOne({ phoneNumber });

    if (!lastLocation || !lastLocation.coordinates) {
      return res.status(404).json({
        success: false,
        error: 'Bu telefon numarası için konum bilgisi bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        coordinates: lastLocation.coordinates,
        timestamp: lastLocation.timestamp
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
router.get('/phone/:phoneNumber', auth, async (req, res, next) => {
  try {
    const { phoneNumber } = req.params;
    
    // Anonim kullanıcı kontrolü - anonim kullanıcılar için izin kontrolü yok
    if (phoneNumber !== 'anonymous') {
      // İzin kontrolü - kullanıcı kendisi mi veya admin mi?
      if (req.user.phoneNumber !== phoneNumber && req.user.role !== 'admin') {
        // Kullanıcı kendisi veya admin değilse, izin isteklerini kontrol et
        const PermissionRequest = require('../models/PermissionRequest');
        const permissionRequest = await PermissionRequest.findOne({
          targetPhoneNumber: phoneNumber,
          requesterPhone: req.user.phoneNumber,
          status: 'accepted'
        });

        if (!permissionRequest) {
          console.log(`${req.user.phoneNumber} kullanıcısının ${phoneNumber} numarasının konum geçmişine erişim izni yok`);
          return res.status(403).json({
            success: false,
            error: 'Bu telefon numarasının konumlarına erişim yetkiniz yok'
          });
        }
        
        console.log(`${req.user.phoneNumber} kullanıcısının ${phoneNumber} numarasının konum geçmişine erişim izni var`);
      }
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
router.get('/nearby', auth, async (req, res, next) => {
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

// Telefon numarasına göre konum verilerini sil
router.delete('/phone/:phoneNumber', auth, async (req, res, next) => {
  try {
    const { phoneNumber } = req.params;
    
    // İzin kontrolü - kullanıcı kendisi mi veya admin mi?
    if (req.user.phoneNumber !== phoneNumber && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Bu telefon numarasının konumlarını silme yetkiniz yok'
      });
    }

    // Telefon numarasına ait tüm konumları sil
    const result = await Location.deleteMany({ phoneNumber });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} konum kaydı başarıyla silindi`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Konum verileri silinirken hata:', err);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

module.exports = router;
