const Location = require('../models/Location');
const Device = require('../models/Device');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Bir cihazın tüm konumlarını getir
// @route   GET /api/locations/device/:deviceId
// @access  Private
exports.getDeviceLocations = async (req, res, next) => {
  try {
    // Önce cihazın kullanıcıya ait olup olmadığını kontrol et
    const device = await Device.findById(req.params.deviceId);

    if (!device) {
      return next(new ErrorResponse(`${req.params.deviceId} ID'li cihaz bulunamadı`, 404));
    }

    // Cihazın kullanıcıya ait olup olmadığını kontrol et
    if (device.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Bu cihazın konumlarına erişim yetkiniz yok', 403));
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

    // Cihaza ait konumları getir
    const locations = await Location.find({
      device: req.params.deviceId,
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

// @desc    Bir cihazın son konumunu getir
// @route   GET /api/locations/device/:deviceId/latest
// @access  Private
exports.getLatestDeviceLocation = async (req, res, next) => {
  try {
    // Önce cihazın kullanıcıya ait olup olmadığını kontrol et
    const device = await Device.findById(req.params.deviceId).populate('lastLocation');

    if (!device) {
      return next(new ErrorResponse(`${req.params.deviceId} ID'li cihaz bulunamadı`, 404));
    }

    // Cihazın kullanıcıya ait olup olmadığını kontrol et
    if (device.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Bu cihazın konumuna erişim yetkiniz yok', 403));
    }

    if (!device.lastLocation) {
      return next(new ErrorResponse('Bu cihaz için konum bilgisi bulunamadı', 404));
    }

    res.status(200).json({
      success: true,
      data: device.lastLocation
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
    const { deviceId, latitude, longitude, altitude, speed, accuracy, address } = req.body;

    // Cihazı kontrol et
    const device = await Device.findOne({ deviceId });

    if (!device) {
      return next(new ErrorResponse(`${deviceId} ID'li cihaz bulunamadı`, 404));
    }

    // Konum oluştur
    const location = await Location.create({
      device: device._id,
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

// @desc    Belirli bir mesafe içindeki cihazları bul
// @route   GET /api/locations/nearby
// @access  Private
exports.getNearbyDevices = async (req, res, next) => {
  try {
    const { latitude, longitude, distance = 10000 } = req.query; // Mesafe metre cinsinden

    if (!latitude || !longitude) {
      return next(new ErrorResponse('Lütfen konum bilgisi giriniz (latitude, longitude)', 400));
    }

    // Kullanıcının cihazlarını bul
    const userDevices = await Device.find({ user: req.user.id }).select('_id');
    const userDeviceIds = userDevices.map(device => device._id);

    // Yakındaki konumları bul
    const locations = await Location.find({
      device: { $in: userDeviceIds },
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(distance)
        }
      }
    }).populate('device');

    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (err) {
    next(err);
  }
};
