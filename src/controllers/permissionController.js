const User = require('../models/User');
const AllowedNumber = require('../models/AllowedNumber');
const PermissionRequest = require('../models/PermissionRequest');

const ErrorResponse = require('../utils/errorResponse');

// @desc    İzin verilen numaraları getir
// @route   GET /api/permissions/allowed-numbers
// @access  Private
exports.getAllowedNumbers = async (req, res, next) => {
  try {
    console.log(`==== İZİN VERİLEN NUMARALARI GETİRME İŞLEMİ BAŞLADI ====`);
    console.log(`Kullanıcı bilgileri: ID=${req.user.id}, Telefon=${req.user.phoneNumber}`);
    
    // Koleksiyon adını kontrol et
    console.log(`AllowedNumber model koleksiyon adı: ${AllowedNumber.collection.name}`);
    
    // Veritabanında bu kullanıcıya ait tüm izin verilen numaraları bul
    console.log(`Kullanıcı ID=${req.user.id} için izin verilen numaralar aranıyor...`);
    const allowedNumbers = await AllowedNumber.find({ user: req.user.id });
    
    console.log(`İzin verilen numara sayısı: ${allowedNumbers.length}`);
    if (allowedNumbers.length > 0) {
      console.log('Bulunan izin verilen numaralar:', JSON.stringify(allowedNumbers, null, 2));
    } else {
      console.log('Bu kullanıcı için izin verilen numara bulunamadı.');
    }
    
    // Frontend'in beklediği formatta yanıt döndür
    res.status(200).json({
      success: true,
      count: allowedNumbers.length,
      data: allowedNumbers
    });
    
    console.log(`==== İZİN VERİLEN NUMARALARI GETİRME İŞLEMİ TAMAMLANDI ====`);
  } catch (err) {
    console.error('İzin verilen numaraları getirirken hata:', err);
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
    console.error('Genel hata:', err);
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
    const { accept, status } = req.body;
    // status parametresi varsa onu kullan, yoksa accept parametresini kullan
    const isAccepted = status === 'accepted' ? true : (accept === true);
    
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
    permissionRequest.status = isAccepted ? 'accepted' : 'rejected';
    await permissionRequest.save();
    
    // Eğer istek kabul edildiyse, numarayı izin verilen numaralar listesine ekle
    if (isAccepted) {
      try {
        // 1. İstek yapan kullanıcıyı (User A) telefon numarasından bul
        const requesterUser = await User.findOne({ phoneNumber: permissionRequest.requesterPhone });

        if (!requesterUser) {
          return next(new ErrorResponse(`İzin isteğini yapan ${permissionRequest.requesterPhone} numaralı kullanıcı sistemde bulunamadı. Bu nedenle izinli numara eklenemedi.`, 404));
        }

        // 2. Bu iznin (istek yapan kullanıcı için hedef numara) zaten var olup olmadığını kontrol et
        const existingAllowedNumber = await AllowedNumber.findOne({
          user: requesterUser._id, 
          phoneNumber: permissionRequest.targetPhoneNumber 
        });
        
        if (!existingAllowedNumber) {
          const newAllowedNumber = new AllowedNumber({
            user: requesterUser._id, 
            phoneNumber: permissionRequest.targetPhoneNumber, 
            name: `İzinli: ${permissionRequest.targetPhoneNumber}`, 
            notes: `${new Date().toLocaleDateString('tr-TR')} tarihinde ${requesterUser.phoneNumber} (${requesterUser.name || 'Bilinmiyor'}) kullanıcısının isteği üzerine ${req.user.phoneNumber} (${req.user.name || 'Bilinmiyor'}) tarafından onaylandı.`
          });
          
          await newAllowedNumber.save();
        }
      } catch (allowedNumberError) {
        return next(new ErrorResponse(`İzin verilen numara veritabanına kaydedilirken bir sorun oluştu: ${allowedNumberError.message}`, 500));
      }
    }

    res.status(200).json({
      success: true,
      message: isAccepted ? 'İzin isteği kabul edildi' : 'İzin isteği reddedildi',
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
