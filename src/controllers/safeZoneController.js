const SafeZone = require('../models/SafeZone');
const Location = require('../models/Location');

// Tüm güvenli bölgeleri getir
exports.getSafeZones = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`[SAFE_ZONES] Tüm güvenli bölgeler isteniyor - Kullanıcı ID: ${userId}`);
    
    const safeZones = await SafeZone.find({ userId });
    
    res.status(200).json({
      success: true,
      count: safeZones.length,
      data: safeZones
    });
  } catch (error) {
    console.error('[SAFE_ZONES] HATA:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
};

// Belirli bir telefon numarasına ait güvenli bölgeleri getir
exports.getSafeZonesByPhone = async (req, res) => {
  try {
    const userId = req.user._id;
    const { phoneNumber } = req.params;
    console.log(`[SAFE_ZONES_BY_PHONE] Telefon numarasına göre güvenli bölgeler isteniyor - Telefon: ${phoneNumber}`);
    
    const safeZones = await SafeZone.find({ 
      userId, 
      phoneNumber 
    });
    
    res.status(200).json({
      success: true,
      count: safeZones.length,
      data: safeZones
    });
  } catch (error) {
    console.error('[SAFE_ZONES_BY_PHONE] HATA:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
};

// Yeni güvenli bölge oluştur
exports.createSafeZone = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`[CREATE_SAFE_ZONE] Yeni güvenli bölge oluşturuluyor - Kullanıcı ID: ${userId}`);
    
    const {
      name,
      description,
      phoneNumber,
      longitude,
      latitude,
      radius,
      category,
      color
    } = req.body;
    
    // Gerekli alanları kontrol et
    if (!name || !phoneNumber || !longitude || !latitude || !radius) {
      console.log(`[CREATE_SAFE_ZONE] Hata - Eksik parametreler: name=${name}, phoneNumber=${phoneNumber}, longitude=${longitude}, latitude=${latitude}, radius=${radius}`);
      return res.status(400).json({
        success: false,
        error: 'Lütfen tüm gerekli alanları doldurun'
      });
    }
    
    // Yeni güvenli bölge oluştur
    const safeZone = new SafeZone({
      name,
      description,
      phoneNumber,
      userId,
      coordinates: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      radius,
      category: category || 'Other',
      color: color || '#007AFF',
      active: true
    });
    
    await safeZone.save();
    
    res.status(201).json({
      success: true,
      data: safeZone
    });
  } catch (error) {
    console.error('[CREATE_SAFE_ZONE] HATA:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
};

// Güvenli bölgeyi güncelle
exports.updateSafeZone = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    console.log(`[UPDATE_SAFE_ZONE] Güvenli bölge güncelleniyor - Bölge ID: ${id}`);
    
    // Güvenli bölgeyi bul
    let safeZone = await SafeZone.findById(id);
    
    // Güvenli bölge bulunamadıysa
    if (!safeZone) {
      console.log(`[UPDATE_SAFE_ZONE] Hata - Güvenli bölge bulunamadı: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Güvenli bölge bulunamadı'
      });
    }
    
    // Kullanıcı yetkisi kontrol et
    if (safeZone.userId.toString() !== userId.toString()) {
      console.log(`[UPDATE_SAFE_ZONE] Hata - Kullanıcı yetkisi yok: ${userId}`);
      return res.status(403).json({
        success: false,
        error: 'Bu güvenli bölgeyi düzenleme yetkiniz yok'
      });
    }
    
    // Güncellenecek alanları al
    const {
      name,
      description,
      phoneNumber,
      longitude,
      latitude,
      radius,
      category,
      color,
      active
    } = req.body;
    
    // Güncellenecek alanları ayarla
    if (name) safeZone.name = name;
    if (description !== undefined) safeZone.description = description;
    if (phoneNumber) safeZone.phoneNumber = phoneNumber;
    if (longitude && latitude) {
      safeZone.coordinates = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };
    }
    if (radius) safeZone.radius = radius;
    if (category) safeZone.category = category;
    if (color) safeZone.color = color;
    if (active !== undefined) safeZone.active = active;
    
    // Güvenli bölgeyi güncelle
    safeZone = await safeZone.save();
    
    res.status(200).json({
      success: true,
      data: safeZone
    });
  } catch (error) {
    console.error('[UPDATE_SAFE_ZONE] HATA:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
};

// Güvenli bölgeyi sil
exports.deleteSafeZone = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    console.log(`[DELETE_SAFE_ZONE] Güvenli bölge siliniyor - Bölge ID: ${id}`);
    
    // Güvenli bölgeyi bul
    const safeZone = await SafeZone.findById(id);
    
    // Güvenli bölge bulunamadıysa
    if (!safeZone) {
      console.log(`[DELETE_SAFE_ZONE] Hata - Güvenli bölge bulunamadı: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Güvenli bölge bulunamadı'
      });
    }
    
    // Kullanıcı yetkisi kontrol et
    if (safeZone.userId.toString() !== userId.toString()) {
      console.log(`[DELETE_SAFE_ZONE] Hata - Kullanıcı yetkisi yok: ${userId}`);
      return res.status(403).json({
        success: false,
        error: 'Bu güvenli bölgeyi silme yetkiniz yok'
      });
    }
    
    // Güvenli bölgeyi sil
    await safeZone.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('[DELETE_SAFE_ZONE] HATA:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
};

// Bir konumun güvenli bölgelerde olup olmadığını kontrol eder
exports.checkLocation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { phoneNumber, latitude, longitude } = req.body;
    console.log(`[SAFE_ZONE_CHECK] Başlangıç - Telefon: ${phoneNumber}, Konum: ${latitude}, ${longitude}`);

    if (!phoneNumber || !latitude || !longitude) {
      console.log(`[SAFE_ZONE_CHECK] Hata - Eksik parametreler: phoneNumber=${phoneNumber}, latitude=${latitude}, longitude=${longitude}`);
      return res.status(400).json({ success: false, message: 'Telefon numarası ve konum bilgileri gereklidir' });
    }
    
    // Telefon numarasına ait tüm güvenli bölgeleri bul
    const safeZones = await SafeZone.find({ phoneNumber, active: true });
    console.log(`[SAFE_ZONE_CHECK] ${phoneNumber} için ${safeZones.length} aktif güvenli bölge bulundu`);
    
    // Kullanıcının son konumunu bul - bunu döngü dışına aldık
    const lastLocation = await Location.findOne({ phoneNumber }).sort({ timestamp: -1 });
    console.log(`[SAFE_ZONE_CHECK] ${phoneNumber} için son konum: ${lastLocation ? 'Bulundu' : 'Bulunamadı'}`);
    if (lastLocation) {
      console.log(`[SAFE_ZONE_CHECK] Son konum bilgileri - Lat: ${lastLocation.latitude}, Lng: ${lastLocation.longitude}, Zaman: ${lastLocation.timestamp}`);
    }
    
    // Her güvenli bölge için kontrol yap
    const results = [];
    const insideZones = [];

    for (const zone of safeZones) {
      // Güvenli bölge merkezi ve şu anki konum arasındaki mesafeyi hesapla
      const zoneCenter = zone.coordinates.coordinates;
      const distance = geolib.getDistance(
        { latitude, longitude },
        { latitude: zoneCenter[1], longitude: zoneCenter[0] }
      );

      // Mesafe güvenli bölge yarıçapından küçükse içeride
      const isInside = distance <= zone.radius;
      console.log(`[SAFE_ZONE_CHECK] Bölge: ${zone.name}, Mesafe: ${distance}m, Yarıçap: ${zone.radius}m, İçeride mi: ${isInside}`);
      console.log(`[SAFE_ZONE_CHECK] Bölge ID: ${zone._id}, Giriş olayları: ${zone.entryEvents.length}, Çıkış olayları: ${zone.exitEvents.length}`);
      
      // Sonuçları doldur
      const result = {
        zoneId: zone._id,
        zoneName: zone.name,
        distance,
        isInside
      };
      
      results.push(result);
      
      // İçerideyse insideZones'a ekle
      if (isInside) {
        insideZones.push({
          zoneId: zone._id,
          zoneName: zone.name,
          distance
        });
      }
      
      // Son konuma göre giriş/çıkış durumunu kontrol et
      if (lastLocation) {
        const lastDistance = geolib.getDistance(
          { latitude: lastLocation.latitude, longitude: lastLocation.longitude },
          { latitude: zoneCenter[1], longitude: zoneCenter[0] }
        );

        const wasInside = lastDistance <= zone.radius;
        console.log(`[SAFE_ZONE_CHECK] Son konum kontrolü - Son mesafe: ${lastDistance}m, Önceden içeride miydi: ${wasInside}`);

        // Son konum dışarıdaydı, şimdi içerideyse -> Giriş olayı
        if (!wasInside && isInside) {
          console.log(`[SAFE_ZONE_CHECK] GİRİŞ OLAYI OLUŞTURULUYOR - Bölge: ${zone.name}, Kullanıcı: ${phoneNumber}`);
          zone.entryEvents.push({
            timestamp: new Date(),
            coordinates: {
              type: 'Point',
              coordinates: [longitude, latitude]
            }
          });
          await zone.save();
          console.log(`[SAFE_ZONE_CHECK] GİRİŞ OLAYI KAYDEDİLDİ - ${phoneNumber} kullanıcısı ${zone.name} güvenli alanına girdi. Yeni giriş olayları sayısı: ${zone.entryEvents.length}`);
        }
        // Son konum içerideydi, şimdi dışarıdaysa -> Çıkış olayı
        else if (wasInside && !isInside) {
          console.log(`[SAFE_ZONE_CHECK] ÇIKIŞ OLAYI OLUŞTURULUYOR - Bölge: ${zone.name}, Kullanıcı: ${phoneNumber}`);
          zone.exitEvents.push({
            timestamp: new Date(),
            coordinates: {
              type: 'Point',
              coordinates: [longitude, latitude]
            }
          });
          await zone.save();
          console.log(`[SAFE_ZONE_CHECK] ÇIKIŞ OLAYI KAYDEDİLDİ - ${phoneNumber} kullanıcısı ${zone.name} güvenli alanından çıktı. Yeni çıkış olayları sayısı: ${zone.exitEvents.length}`);
        } else {
          console.log(`[SAFE_ZONE_CHECK] Durum değişikliği yok - ${wasInside ? 'İçeride kalmaya devam ediyor' : 'Dışarıda kalmaya devam ediyor'}`);
        }
      }
      // Son konum kaydı yoksa ve kullanıcı güvenli alanda ise
      else if (isInside) {
        console.log(`[SAFE_ZONE_CHECK] İLK GİRİŞ OLAYI OLUŞTURULUYOR - Son konum yok, şu an içeride. Bölge: ${zone.name}, Kullanıcı: ${phoneNumber}`);
        // İlk giriş olayını kaydet
        zone.entryEvents.push({
          timestamp: new Date(),
          coordinates: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        });
        await zone.save();
        console.log(`[SAFE_ZONE_CHECK] İLK GİRİŞ OLAYI KAYDEDİLDİ - Bölge: ${zone.name}, Kullanıcı: ${phoneNumber}, Yeni giriş olayları sayısı: ${zone.entryEvents.length}`);
      }
    }
    
    console.log(`[SAFE_ZONE_CHECK] Tamamlandı - ${phoneNumber} için ${results.length} bölge kontrol edildi, ${insideZones.length} bölge içinde`);
    return res.json({
      success: true,
      data: {
        phoneNumber,
        coordinates: [longitude, latitude],
        results,
        insideCount: insideZones.length,
        insideZones
      }
    });
  } catch (error) {
    console.error('[SAFE_ZONE_CHECK] HATA:', error);
    return res.status(500).json({ success: false, message: 'Konum kontrolü sırasında bir hata oluştu' });
  }
};

// Güvenli bölge giriş/çıkış olaylarını getir
exports.getZoneEvents = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    
    // Güvenli bölgeyi bul
    const safeZone = await SafeZone.findById(id);
    
    // Güvenli bölge bulunamadıysa
    if (!safeZone) {
      return res.status(404).json({
        success: false,
        error: 'Güvenli bölge bulunamadı'
      });
    }
    
    // Kullanıcı yetkisi kontrol et
    if (safeZone.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Bu güvenli bölgenin olaylarını görüntüleme yetkiniz yok'
      });
    }
    
    // Son 20 giriş ve çıkış olayını al
    const entryEvents = safeZone.entryEvents.slice(-20);
    const exitEvents = safeZone.exitEvents.slice(-20);
    
    res.status(200).json({
      success: true,
      data: {
        safeZoneId: safeZone._id,
        name: safeZone.name,
        phoneNumber: safeZone.phoneNumber,
        entryEvents,
        exitEvents
      }
    });
  } catch (error) {
    console.error('Güvenli bölge olayları alınırken hata:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
};
