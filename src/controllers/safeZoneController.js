const SafeZone = require('../models/SafeZone');
const Location = require('../models/Location');

// Tüm güvenli bölgeleri getir
exports.getSafeZones = async (req, res) => {
  try {
    const userId = req.user._id;
    const safeZones = await SafeZone.find({ userId });
    
    res.status(200).json({
      success: true,
      count: safeZones.length,
      data: safeZones
    });
  } catch (error) {
    console.error('Güvenli bölgeler alınırken hata:', error);
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
    console.error('Telefon numarasına ait güvenli bölgeler alınırken hata:', error);
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
    console.error('Güvenli bölge oluşturulurken hata:', error);
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
    
    // Güvenli bölgeyi bul
    let safeZone = await SafeZone.findById(id);
    
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
    console.error('Güvenli bölge güncellenirken hata:', error);
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
    console.error('Güvenli bölge silinirken hata:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
};

// Bir konumun güvenli bölgede olup olmadığını kontrol et
exports.checkLocation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { phoneNumber, longitude, latitude } = req.body;
    
    // Gerekli alanları kontrol et
    if (!phoneNumber || !longitude || !latitude) {
      return res.status(400).json({
        success: false,
        error: 'Lütfen tüm gerekli alanları doldurun'
      });
    }
    
    // Telefon numarasına ait güvenli bölgeleri bul
    const safeZones = await SafeZone.find({ 
      userId, 
      phoneNumber,
      active: true
    });
    
    // Her güvenli bölge için konum kontrolü yap
    const results = safeZones.map(zone => {
      const isInside = zone.isInside(longitude, latitude);
      return {
        safeZoneId: zone._id,
        name: zone.name,
        isInside
      };
    });
    
    // İçinde olunan güvenli bölgeleri bul
    const insideZones = results.filter(r => r.isInside);
    
    // Konum güncellemesi için giriş/çıkış olaylarını kaydet
    for (const zone of safeZones) {
      const isInside = zone.isInside(longitude, latitude);
      
      // Son konum kaydını bul
      const lastLocation = await Location.findOne({ 
        phoneNumber 
      }).sort({ timestamp: -1 });
      
      // Son konum kaydı varsa
      if (lastLocation) {
        const wasInside = zone.isInside(
          lastLocation.coordinates.coordinates[0],
          lastLocation.coordinates.coordinates[1]
        );
        
        // Giriş olayı
        if (isInside && !wasInside) {
          zone.entryEvents.push({
            timestamp: new Date(),
            coordinates: {
              type: 'Point',
              coordinates: [longitude, latitude]
            }
          });
          await zone.save();
          console.log(`Giriş olayı kaydedildi: ${zone.name}, ${phoneNumber}`);
        }
        
        // Çıkış olayı
        if (!isInside && wasInside) {
          zone.exitEvents.push({
            timestamp: new Date(),
            coordinates: {
              type: 'Point',
              coordinates: [longitude, latitude]
            }
          });
          await zone.save();
          console.log(`Çıkış olayı kaydedildi: ${zone.name}, ${phoneNumber}`);
        }
      } 
      // Son konum kaydı yoksa ve kullanıcı güvenli alanda ise
      else if (isInside) {
        // İlk giriş olayını kaydet
        zone.entryEvents.push({
          timestamp: new Date(),
          coordinates: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        });
        await zone.save();
        console.log(`İlk giriş olayı kaydedildi: ${zone.name}, ${phoneNumber}`);
      }
    }
    
    res.status(200).json({
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
    console.error('Konum kontrolü yapılırken hata:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
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
