const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Telefon numarasına göre konum kaydetme
router.post('/phone', auth, async (req, res) => {
  try {
    const { phoneNumber, latitude, longitude, speed, heading, altitude, accuracy, timestamp } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Telefon numarası gerekli' });
    }
    
    // Telefon numarasına göre kullanıcıyı bul
    const user = await User.findOne({ phoneNumber });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Bu telefon numarasına sahip kullanıcı bulunamadı' });
    }
    
    // Yeni konum oluştur
    const location = new Location({
      user: user._id,
      phoneNumber,
      coords: {
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        altitude: altitude || 0,
        accuracy: accuracy || 0
      },
      timestamp: timestamp || Date.now()
    });
    
    await location.save();
    
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    console.error('Konum kaydedilirken hata oluştu:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// Telefon numarasına göre son konumu getir
router.get('/phone/:phoneNumber', auth, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    // Telefon numarasına göre son konumu bul
    const location = await Location.findOne({ phoneNumber })
      .sort({ timestamp: -1 })
      .limit(1);
    
    if (!location) {
      return res.status(404).json({ success: false, error: 'Bu telefon numarasına ait konum bulunamadı' });
    }
    
    res.json({ success: true, data: location });
  } catch (error) {
    console.error('Konum getirilirken hata oluştu:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// Telefon numarasına göre konum geçmişini getir
router.get('/history/phone/:phoneNumber', auth, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { limit = 50, startDate, endDate } = req.query;
    
    // Tarih filtresi için sorgu oluştur
    const query = { phoneNumber };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    // Telefon numarasına göre konum geçmişini bul
    const locations = await Location.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json({ success: true, data: locations });
  } catch (error) {
    console.error('Konum geçmişi getirilirken hata oluştu:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

module.exports = router;
