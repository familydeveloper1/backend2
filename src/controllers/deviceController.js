const Device = require('../models/Device');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Tüm cihazları getir
// @route   GET /api/devices
// @access  Private
exports.getDevices = async (req, res, next) => {
  try {
    // Kullanıcıya ait cihazları getir
    const devices = await Device.find({ user: req.user.id })
      .populate('lastLocation')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: devices.length,
      data: devices
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Tek bir cihazı getir
// @route   GET /api/devices/:id
// @access  Private
exports.getDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id)
      .populate('lastLocation');

    if (!device) {
      return next(new ErrorResponse(`${req.params.id} ID'li cihaz bulunamadı`, 404));
    }

    // Cihazın kullanıcıya ait olup olmadığını kontrol et
    if (device.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Bu cihaza erişim yetkiniz yok', 403));
    }

    res.status(200).json({
      success: true,
      data: device
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Yeni cihaz ekle
// @route   POST /api/devices
// @access  Private
exports.createDevice = async (req, res, next) => {
  try {
    // Kullanıcı ID'sini ekle
    req.body.user = req.user.id;

    const device = await Device.create(req.body);

    // Kullanıcının devices dizisine cihazı ekle
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { devices: device._id } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      data: device
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cihazı güncelle
// @route   PUT /api/devices/:id
// @access  Private
exports.updateDevice = async (req, res, next) => {
  try {
    let device = await Device.findById(req.params.id);

    if (!device) {
      return next(new ErrorResponse(`${req.params.id} ID'li cihaz bulunamadı`, 404));
    }

    // Cihazın kullanıcıya ait olup olmadığını kontrol et
    if (device.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Bu cihazı güncelleme yetkiniz yok', 403));
    }

    device = await Device.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: device
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cihazı sil
// @route   DELETE /api/devices/:id
// @access  Private
exports.deleteDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return next(new ErrorResponse(`${req.params.id} ID'li cihaz bulunamadı`, 404));
    }

    // Cihazın kullanıcıya ait olup olmadığını kontrol et
    if (device.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Bu cihazı silme yetkiniz yok', 403));
    }

    // Kullanıcının devices dizisinden cihazı çıkar
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { devices: device._id } },
      { new: true }
    );

    await device.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
