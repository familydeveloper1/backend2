const Activity = require('../models/Activity');
const { validationResult } = require('express-validator');

/**
 * Yeni bir aktivite başlatır
 * @param {Object} req - Request objesi
 * @param {Object} res - Response objesi
 */
const startActivity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { userId, phoneNumber, type } = req.body;

    // Aktif bir aktivite var mı kontrol et
    const existingActivity = await Activity.findOne({
      userId,
      phoneNumber,
      isActive: true
    });

    if (existingActivity) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon numarası için zaten aktif bir aktivite bulunmaktadır',
        data: existingActivity
      });
    }

    // Yeni aktivite oluştur
    const newActivity = new Activity({
      userId,
      phoneNumber,
      type: type || 'other',
      startTime: new Date(),
      locations: []
    });

    await newActivity.save();

    res.status(201).json({
      success: true,
      message: 'Aktivite başarıyla başlatıldı',
      data: newActivity
    });
  } catch (error) {
    console.error('Aktivite başlatma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Aktivite başlatılırken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Aktif bir aktiviteyi durdurur
 * @param {Object} req - Request objesi
 * @param {Object} res - Response objesi
 */
const stopActivity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { activityId } = req.params;
    const { distance, calories, avgSpeed, maxSpeed } = req.body;

    const activity = await Activity.findById(activityId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Aktivite bulunamadı'
      });
    }

    if (!activity.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Bu aktivite zaten durdurulmuş'
      });
    }

    const endTime = new Date();
    const durationInSeconds = Math.floor((endTime - activity.startTime) / 1000);

    activity.endTime = endTime;
    activity.duration = durationInSeconds;
    activity.isActive = false;
    
    // Eğer gönderildiyse istatistikleri güncelle
    if (distance) activity.distance = distance;
    if (calories) activity.calories = calories;
    if (avgSpeed) activity.avgSpeed = avgSpeed;
    if (maxSpeed) activity.maxSpeed = maxSpeed;
    
    activity.updatedAt = endTime;

    await activity.save();

    res.status(200).json({
      success: true,
      message: 'Aktivite başarıyla durduruldu',
      data: activity
    });
  } catch (error) {
    console.error('Aktivite durdurma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Aktivite durdurulurken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Aktiviteye konum ekler
 * @param {Object} req - Request objesi
 * @param {Object} res - Response objesi
 */
const addLocationToActivity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { activityId } = req.params;
    const { latitude, longitude, speed, altitude } = req.body;

    const activity = await Activity.findById(activityId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Aktivite bulunamadı'
      });
    }

    if (!activity.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Bu aktivite aktif değil, konum eklenemez'
      });
    }

    const locationData = {
      latitude,
      longitude,
      timestamp: new Date(),
      speed: speed || 0,
      altitude: altitude || 0
    };

    activity.locations.push(locationData);
    activity.updatedAt = new Date();

    await activity.save();

    res.status(200).json({
      success: true,
      message: 'Konum başarıyla eklendi',
      data: locationData
    });
  } catch (error) {
    console.error('Aktiviteye konum ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Konum eklenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Kullanıcının aktivitelerini listeler
 * @param {Object} req - Request objesi
 * @param {Object} res - Response objesi
 */
const getUserActivities = async (req, res) => {
  try {
    const { userId, phoneNumber } = req.params;
    const { limit = 20, skip = 0, isActive, startDate, endDate, type } = req.query;

    const query = {
      userId
    };

    if (phoneNumber) {
      query.phoneNumber = phoneNumber;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.startTime = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.startTime = { $lte: new Date(endDate) };
    }

    if (type) {
      query.type = type;
    }

    const activities = await Activity.find(query)
      .sort({ startTime: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const totalCount = await Activity.countDocuments(query);

    res.status(200).json({
      success: true,
      count: activities.length,
      total: totalCount,
      data: activities
    });
  } catch (error) {
    console.error('Aktiviteleri listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Aktiviteler listelenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Belirli bir aktivitenin detaylarını getirir
 * @param {Object} req - Request objesi
 * @param {Object} res - Response objesi
 */
const getActivityDetails = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { includeLocations } = req.query;

    let activity;
    
    if (includeLocations === 'true') {
      activity = await Activity.findById(activityId);
    } else {
      activity = await Activity.findById(activityId).select('-locations');
    }

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Aktivite bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Aktivite detayları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Aktivite detayları getirilirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Aktivite istatistiklerini günceller
 * @param {Object} req - Request objesi
 * @param {Object} res - Response objesi
 */
const updateActivityStats = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { activityId } = req.params;
    const { distance, duration, calories, avgSpeed, maxSpeed, type, notes } = req.body;

    const activity = await Activity.findById(activityId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Aktivite bulunamadı'
      });
    }

    // İstatistikleri güncelle
    if (distance !== undefined) activity.distance = distance;
    if (duration !== undefined) activity.duration = duration;
    if (calories !== undefined) activity.calories = calories;
    if (avgSpeed !== undefined) activity.avgSpeed = avgSpeed;
    if (maxSpeed !== undefined) activity.maxSpeed = maxSpeed;
    if (type !== undefined) activity.type = type;
    if (notes !== undefined) activity.notes = notes;
    
    activity.updatedAt = new Date();

    await activity.save();

    res.status(200).json({
      success: true,
      message: 'Aktivite istatistikleri başarıyla güncellendi',
      data: activity
    });
  } catch (error) {
    console.error('Aktivite istatistikleri güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Aktivite istatistikleri güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Bir aktiviteyi siler
 * @param {Object} req - Request objesi
 * @param {Object} res - Response objesi
 */
const deleteActivity = async (req, res) => {
  try {
    const { activityId } = req.params;

    const activity = await Activity.findById(activityId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Aktivite bulunamadı'
      });
    }

    await Activity.findByIdAndDelete(activityId);

    res.status(200).json({
      success: true,
      message: 'Aktivite başarıyla silindi'
    });
  } catch (error) {
    console.error('Aktivite silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Aktivite silinirken bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Kullanıcının aktivite özetini getirir
 * @param {Object} req - Request objesi
 * @param {Object} res - Response objesi
 */
const getActivitySummary = async (req, res) => {
  try {
    const { userId, phoneNumber } = req.params;
    const { period } = req.query; // 'day', 'week', 'month', 'year'

    console.log(`Aktivite özeti getiriliyor - UserId: ${userId}, PhoneNumber: ${phoneNumber}, Period: ${period}`);

    const query = {
      userId,
      isActive: false
    };

    if (phoneNumber) {
      query.phoneNumber = phoneNumber;
    }

    // Tarih aralığını belirle
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        // Varsayılan olarak son 30 gün
        startDate.setDate(now.getDate() - 30);
    }

    query.startTime = { $gte: startDate, $lte: now };
    console.log('Sorgu kriterleri:', JSON.stringify(query));

    // Aktivite türlerine göre istatistikleri hesapla
    const activities = await Activity.find(query);
    console.log(`Bulunan aktivite sayısı: ${activities.length}`);

    // Özet istatistikleri hesapla
    const summary = {
      totalActivities: activities.length,
      totalDistance: 0,
      totalDuration: 0,
      totalCalories: 0,
      byType: {}
    };

    activities.forEach(activity => {
      summary.totalDistance += activity.distance || 0;
      summary.totalDuration += activity.duration || 0;
      summary.totalCalories += activity.calories || 0;

      // Aktivite türüne göre grupla
      if (!summary.byType[activity.type]) {
        summary.byType[activity.type] = {
          count: 0,
          distance: 0,
          duration: 0,
          calories: 0
        };
      }

      summary.byType[activity.type].count++;
      summary.byType[activity.type].distance += activity.distance || 0;
      summary.byType[activity.type].duration += activity.duration || 0;
      summary.byType[activity.type].calories += activity.calories || 0;
    });

    console.log('Oluşturulan özet:', JSON.stringify(summary));

    res.status(200).json({
      success: true,
      count: activities.length,
      period,
      startDate,
      endDate: now,
      data: summary
    });
  } catch (error) {
    console.error('Aktivite özeti getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Aktivite özeti getirilirken bir hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  startActivity,
  stopActivity,
  addLocationToActivity,
  getUserActivities,
  getActivityDetails,
  updateActivityStats,
  deleteActivity,
  getActivitySummary
};
