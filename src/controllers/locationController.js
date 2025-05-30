const Location = require('../models/Location');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Bir telefon numarasının tüm konumlarını getir
// @route   GET /api/locations/phone/:phoneNumber
// @access  Private
exports.getPhoneLocations = async (req, res, next) => {
  try {
    const { phoneNumber } = req.params;
    
    // Telefon numarasının sahibini kontrol et
    const targetUser = await User.findOne({ phoneNumber });

    // İzin kontrolü - kullanıcı kendisi mi veya admin mi?
    if (req.user.phoneNumber !== phoneNumber && req.user.role !== 'admin') {
      return next(new ErrorResponse('Bu telefon numarasının konumlarına erişim yetkiniz yok', 403));
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
    next(err);
  }
};

// @desc    Bir telefon numarasının son konumunu getir
// @route   GET /api/locations/phone/:phoneNumber/latest
// @access  Private
exports.getLatestPhoneLocation = async (req, res, next) => {
  try {
    const { phoneNumber } = req.params;
    
    // Telefon numarasının sahibini kontrol et
    const targetUser = await User.findOne({ phoneNumber });

    if (!targetUser) {
      return next(new ErrorResponse(`${phoneNumber} numaralı kullanıcı bulunamadı`, 404));
    }

    // İzin kontrolü - kullanıcı kendisi mi veya admin mi?
    if (req.user.phoneNumber !== phoneNumber && req.user.role !== 'admin') {
      return next(new ErrorResponse('Bu telefon numarasının konumuna erişim yetkiniz yok', 403));
    }

    // Son konumu kullanıcı modelinden al
    if (!targetUser.lastKnownLocation) {
      return next(new ErrorResponse('Bu telefon numarası için konum bilgisi bulunamadı', 404));
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
    next(err);
  }
};

// @desc    Yeni konum ekle
// @route   POST /api/locations
// @access  Private
exports.createLocation = async (req, res, next) => {
  try {
    const { phoneNumber, latitude, longitude, altitude, speed, accuracy, address } = req.body;

    // Telefon numarasını kontrol et
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return next(new ErrorResponse(`${phoneNumber} numaralı kullanıcı bulunamadı`, 404));
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
      accuracy,
      address
    });

    res.status(201).json({
      success: true,
      data: location
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Belirli bir mesafe içindeki kullanıcıları bul
// @route   GET /api/locations/nearby
// @access  Private
exports.getNearbyUsers = async (req, res, next) => {
  try {
    const { latitude, longitude, distance = 10000 } = req.query; // Mesafe metre cinsinden

    if (!latitude || !longitude) {
      return next(new ErrorResponse('Lütfen konum bilgisi giriniz (latitude, longitude)', 400));
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
    next(err);
  }
};
