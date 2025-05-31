const User = require('../models/User');
const AllowedNumber = require('../models/AllowedNumber');
const PermissionRequest = require('../models/PermissionRequest');
const ErrorResponse = require('../utils/errorResponse');

// @desc    İzin verilen numaraları getir
// @route   GET /api/permissions/allowed-numbers
// @access  Private
exports.getAllowedNumbers = async (req, res, next) => {
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
};

// @desc    İzin verilen numara ekle
// @route   POST /api/permissions/allowed-numbers
// @access  Private
exports.addAllowedNumber = async (req, res, next) => {
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
};

// @desc    İzin verilen numara sil
// @route   DELETE /api/permissions/allowed-numbers/:id
// @access  Private
exports.removeAllowedNumber = async (req, res, next) => {
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
};

// @desc    Telefon numarası için izin isteği gönder
// @route   POST /api/permissions/request
// @access  Private
exports.requestPhonePermission = async (req, res, next) => {
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
};

// @desc    İzin isteklerini getir
// @route   GET /api/permissions/requests
// @access  Private
exports.getPermissionRequests = async (req, res, next) => {
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
};

// @desc    İzin isteğini yanıtla
// @route   PUT /api/permissions/request/:id
// @access  Private
exports.respondToPermissionRequest = async (req, res, next) => {
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
    
    // Eğer istek kabul edildiyse, numarayı izin verilen numaralar listesine ekle
    if (accept) {
      try {
        console.log(`İzin isteği kabul edildi. İstek sahibi: ${permissionRequest.requesterPhone}, Hedef: ${permissionRequest.targetPhoneNumber}`);
        console.log(`Kullanıcı bilgileri: ID=${req.user.id}, Telefon=${req.user.phoneNumber}`);
        
        // Önce bu numaranın zaten eklenmiş olup olmadığını kontrol et
        const existingAllowedNumber = await AllowedNumber.findOne({
          user: req.user.id,
          phoneNumber: permissionRequest.requesterPhone
        });
        
        console.log(`Mevcut izin kontrolü: ${existingAllowedNumber ? 'Numara zaten ekli' : 'Numara henüz eklenmemiş'}`);
        
        // Eğer daha önce eklenmemişse, izin verilen numaralara ekle
        if (!existingAllowedNumber) {
          const newAllowedNumber = new AllowedNumber({
            user: req.user.id,
            phoneNumber: permissionRequest.requesterPhone,
            name: `İzin isteği ile eklendi - ${permissionRequest.requesterPhone}`,
            notes: `${new Date().toISOString()} tarihinde izin isteği kabul edilerek eklendi.`
          });
          
          console.log(`Yeni izin verilen numara oluşturuldu:`, newAllowedNumber);
          
          await newAllowedNumber.save();
          console.log(`İzin isteği kabul edildi ve ${permissionRequest.requesterPhone} numarası izin verilen numaralar listesine eklendi.`);
        } else {
          console.log(`${permissionRequest.requesterPhone} numarası zaten izin verilen numaralar listesinde bulunuyor.`);
        }
      } catch (allowedNumberError) {
        console.error('İzin verilen numara eklenirken hata oluştu:', allowedNumberError);
        // Ana işlemi etkilememesi için hatayı sadece logluyoruz
      }
    }

    res.status(200).json({
      success: true,
      message: accept ? 'İzin isteği kabul edildi' : 'İzin isteği reddedildi',
      data: permissionRequest
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bir telefon numarasını takip etmek için izin durumunu kontrol et
// @route   GET /api/permissions/check/phone/:phoneNumber
// @access  Private
exports.checkTrackingPermission = async (req, res, next) => {
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
};
