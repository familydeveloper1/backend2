const SafeZone = require('../models/SafeZone');
const Location = require('../models/Location');

// Haversine formülü ile iki nokta arasındaki mesafeyi hesaplama (metre cinsinden)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000; // metre cinsinden dünya yarıçapı
  const toRad = (deg) => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // metre cinsinden mesafe
}

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

    // Konum verilerinin doğru formatta olup olmadığını kontrol et
    if (!phoneNumber || latitude === undefined || longitude === undefined) {
      console.log(`[SAFE_ZONE_CHECK] Hata - Eksik parametreler: phoneNumber=${phoneNumber}, latitude=${latitude}, longitude=${longitude}`);
      return res.status(400).json({ success: false, message: 'Telefon numarası ve konum bilgileri gereklidir' });
    }
    
    // Konum verilerini sayıya dönüştür (iOS emülatöründen string olarak gelebilir)
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      console.log(`[SAFE_ZONE_CHECK] Hata - Geçersiz konum formatı: latitude=${latitude}, longitude=${longitude}`);
      return res.status(400).json({ success: false, message: 'Geçersiz konum formatı' });
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
      const distance = haversine(
        lat, lng, // Dönüştürülmüş değerleri kullan
        zoneCenter[1], zoneCenter[0]
      );
      
      console.log(`[SAFE_ZONE_CHECK] Mesafe hesaplandı: ${distance}m, Konum: ${lat}, ${lng}, Merkez: ${zoneCenter[1]}, ${zoneCenter[0]}`);

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
        // Son konum verilerini sayıya dönüştür
        const lastLat = parseFloat(lastLocation.latitude);
        const lastLng = parseFloat(lastLocation.longitude);
        
        if (isNaN(lastLat) || isNaN(lastLng)) {
          console.log(`[SAFE_ZONE_CHECK] Uyarı - Son konum geçersiz format: ${lastLocation.latitude}, ${lastLocation.longitude}`);
          // Geçersiz son konum durumunda, ilk giriş/çıkış olayı gibi davran
          if (isInside) {
            console.log(`[SAFE_ZONE_CHECK] Geçersiz son konum, ilk giriş olayı oluşturuluyor`);
            zone.entryEvents.push({
              timestamp: new Date(),
              coordinates: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              note: 'Geçersiz son konum sonrası ilk giriş'
            });
            await zone.save();
            continue; // Bu güvenli bölge için işlemi tamamla ve sonrakine geç
          }
          continue; // Geçersiz son konum ve dışarıdaysa, hiçbir şey yapma
        }
        
        const lastDistance = haversine(
          lastLat, lastLng,
          zoneCenter[1], zoneCenter[0]
        );

        const wasInside = lastDistance <= zone.radius;
        console.log(`[SAFE_ZONE_CHECK] Son konum detayları - LastLat: ${lastLat}, LastLng: ${lastLng}, LastDistance: ${lastDistance}m`);
        console.log(`[SAFE_ZONE_CHECK] Son konum kontrolü - Son mesafe: ${lastDistance}m, Önceden içeride miydi: ${wasInside}`);

        // Şu anki zaman
        const now = new Date();
        const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 saat (milisaniye cinsinden)
        
        // Son konum dışarıdaydı, şimdi içerideyse -> Giriş olayı
        if (!wasInside && isInside) {
          console.log(`[SAFE_ZONE_CHECK] GİRİŞ OLAYI OLUŞTURULUYOR - Bölge: ${zone.name}, Kullanıcı: ${phoneNumber}`);
          zone.entryEvents.push({
            timestamp: now,
            coordinates: {
              type: 'Point',
              coordinates: [lng, lat] // Dönüştürülmüş değerleri kullan
            },
            note: 'iOS emülatör testi: ' + new Date().toISOString()
          });
          await zone.save();
          console.log(`[SAFE_ZONE_CHECK] GİRİŞ OLAYI KAYDEDİLDİ - ${phoneNumber} kullanıcısı ${zone.name} güvenli alanına girdi. Yeni giriş olayları sayısı: ${zone.entryEvents.length}`);
        }
        // Son konum içerideydi, şimdi dışarıdaysa -> Çıkış olayı
        else if (wasInside && !isInside) {
          console.log(`[SAFE_ZONE_CHECK] ÇIKIŞ OLAYI OLUŞTURULUYOR - Bölge: ${zone.name}, Kullanıcı: ${phoneNumber}`);
          zone.exitEvents.push({
            timestamp: now,
            coordinates: {
              type: 'Point',
              coordinates: [lng, lat] // Dönüştürülmüş değerleri kullan
            },
            note: 'iOS emülatör testi: ' + new Date().toISOString()
          });
          await zone.save();
          console.log(`[SAFE_ZONE_CHECK] ÇIKIŞ OLAYI KAYDEDİLDİ - ${phoneNumber} kullanıcısı ${zone.name} güvenli alanından çıktı. Yeni çıkış olayları sayısı: ${zone.exitEvents.length}`);
        } 
        // Durum değişikliği yoksa, son olay zamanını kontrol et ve gerekirse yeni olay oluştur
        else {
          console.log(`[SAFE_ZONE_CHECK] Durum değişikliği yok - ${wasInside ? 'İçeride kalmaya devam ediyor' : 'Dışarıda kalmaya devam ediyor'}`);
          
          try {
            // İçerideyse ve son giriş olayından beri uzun süre geçtiyse yeni giriş olayı oluştur
            if (isInside && zone.entryEvents.length > 0) {
              const lastEntryEvent = zone.entryEvents[zone.entryEvents.length - 1];
              const timeSinceLastEntry = now.getTime() - new Date(lastEntryEvent.timestamp).getTime();
              
              console.log(`[SAFE_ZONE_CHECK] Son giriş olayından bu yana geçen süre: ${Math.round(timeSinceLastEntry / (60 * 60 * 1000))} saat`);
              
              // Son giriş olayından beri 24 saatten fazla zaman geçtiyse yeni giriş olayı oluştur
              if (timeSinceLastEntry > ONE_DAY_MS) {
                console.log(`[SAFE_ZONE_CHECK] PERIYODIK GİRİŞ OLAYI OLUŞTURULUYOR - Son olaydan 24+ saat geçti. Bölge: ${zone.name}, Kullanıcı: ${phoneNumber}`);
                zone.entryEvents.push({
                  timestamp: now,
                  coordinates: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                  },
                  note: 'Periyodik güncelleme - 24 saatten fazla içeride kaldı'
                });
                await zone.save();
                console.log(`[SAFE_ZONE_CHECK] PERIYODIK GİRİŞ OLAYI KAYDEDİLDİ - ${phoneNumber} kullanıcısı ${zone.name} güvenli alanında 24+ saat kaldı. Yeni giriş olayları sayısı: ${zone.entryEvents.length}`);
              }
            }
            // Dışarıdaysa ve son çıkış olayından beri uzun süre geçtiyse yeni çıkış olayı oluştur
            else if (!isInside && zone.exitEvents.length > 0) {
              const lastExitEvent = zone.exitEvents[zone.exitEvents.length - 1];
              const timeSinceLastExit = now.getTime() - new Date(lastExitEvent.timestamp).getTime();
              
              console.log(`[SAFE_ZONE_CHECK] Son çıkış olayından bu yana geçen süre: ${Math.round(timeSinceLastExit / (60 * 60 * 1000))} saat`);
              
              // Son çıkış olayından beri 24 saatten fazla zaman geçtiyse yeni çıkış olayı oluştur
              if (timeSinceLastExit > ONE_DAY_MS) {
                console.log(`[SAFE_ZONE_CHECK] PERIYODIK ÇIKIŞ OLAYI OLUŞTURULUYOR - Son olaydan 24+ saat geçti. Bölge: ${zone.name}, Kullanıcı: ${phoneNumber}`);
                zone.exitEvents.push({
                  timestamp: now,
                  coordinates: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                  },
                  note: 'Periyodik güncelleme - 24 saatten fazla dışarıda kaldı'
                });
                await zone.save();
                console.log(`[SAFE_ZONE_CHECK] PERIYODIK ÇIKIŞ OLAYI KAYDEDİLDİ - ${phoneNumber} kullanıcısı ${zone.name} güvenli alanının dışında 24+ saat kaldı. Yeni çıkış olayları sayısı: ${zone.exitEvents.length}`);
              }
            }
          } catch (eventError) {
            console.error(`[SAFE_ZONE_CHECK] Periyodik olay oluşturma hatası:`, eventError);
            // Hata olsa bile ana işlemi devam ettir, sadece logla
          }
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
            coordinates: [lng, lat] // Dönüştürülmüş değerleri kullan
          },
          note: 'İlk giriş kaydı - iOS emülatör testi: ' + new Date().toISOString()
        });
        await zone.save();
        console.log(`[SAFE_ZONE_CHECK] İLK GİRİŞ OLAYI KAYDEDİLDİ - Bölge: ${zone.name}, Kullanıcı: ${phoneNumber}, Yeni giriş olayları sayısı: ${zone.entryEvents.length}`);
      }
      // Son konum kaydı yoksa ve kullanıcı güvenli alanın dışındaysa
      else {
        console.log(`[SAFE_ZONE_CHECK] İLK ÇIKIŞ OLAYI OLUŞTURULUYOR - Son konum yok, şu an dışarıda. Bölge: ${zone.name}, Kullanıcı: ${phoneNumber}`);
        // İlk çıkış olayını kaydet
        zone.exitEvents.push({
          timestamp: new Date(),
          coordinates: {
            type: 'Point',
            coordinates: [lng, lat] // Dönüştürülmüş değerleri kullan
          },
          note: 'İlk çıkış kaydı - iOS emülatör testi: ' + new Date().toISOString()
        });
        await zone.save();
        console.log(`[SAFE_ZONE_CHECK] İLK ÇIKIŞ OLAYI KAYDEDİLDİ - Bölge: ${zone.name}, Kullanıcı: ${phoneNumber}, Yeni çıkış olayları sayısı: ${zone.exitEvents.length}`);
      }
    }
    
    console.log(`[SAFE_ZONE_CHECK] Tamamlandı - ${phoneNumber} için ${results.length} bölge kontrol edildi, ${insideZones.length} bölge içinde`);
    return res.json({
      success: true,
      data: {
        phoneNumber,
        coordinates: [lng, lat], // Dönüştürülmüş değerleri kullan
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
