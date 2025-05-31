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
  console.log('==== İZIN İSTEĞİ YANITLAMA BAŞLADI ====');
  console.log(`İstek ID: ${req.params.id}`);
  console.log(`Yanıt: ${req.body.accept ? 'Kabul' : 'Red'}`);
  
  try {
    const { accept } = req.body;

    console.log(`İzin isteği bulunuyor... ID: ${req.params.id}`);
    const permissionRequest = await PermissionRequest.findById(req.params.id);

    if (!permissionRequest) {
      console.log(`HATA: ${req.params.id} ID'li izin isteği bulunamadı`);
      return next(new ErrorResponse(`${req.params.id} ID'li izin isteği bulunamadı`, 404));
    }
    
    console.log('Bulunan izin isteği:', JSON.stringify(permissionRequest, null, 2));

    // İsteğin kullanıcıya ait olup olmadığını kontrol et - telefon numarası tabanlı sistem için güncellendi
    console.log(`Yetki kontrolü: ownerPhone=${permissionRequest.ownerPhoneNumber}, userPhone=${req.user.phoneNumber}`);
    console.log(`Yetki kontrolü (ID): ownerUser=${permissionRequest.ownerUser}, userId=${req.user.id}`);
    
    if (permissionRequest.ownerPhoneNumber !== req.user.phoneNumber && 
        (!permissionRequest.ownerUser || permissionRequest.ownerUser.toString() !== req.user.id)) {
      console.log('HATA: Bu isteği yanıtlama yetkisi yok');
      return next(new ErrorResponse('Bu isteği yanıtlama yetkiniz yok', 403));
    }

    // İsteği güncelle
    console.log(`İzin isteği durumu güncelleniyor: ${accept ? 'accepted' : 'rejected'}`);
    permissionRequest.status = accept ? 'accepted' : 'rejected';
    await permissionRequest.save();
    console.log('İzin isteği durumu güncellendi');
    
    // Eğer istek kabul edildiyse, numarayı izin verilen numaralar listesine ekle
    if (accept) {
      console.log('==== İZİN VERİLEN NUMARA EKLEME İŞLEMİ BAŞLADI ====');
      try {
        console.log(`İzin isteği kabul edildi. İstek sahibi tel: ${permissionRequest.requesterPhone}, Hedef (izin verilen) tel: ${permissionRequest.targetPhoneNumber}`);
        console.log(`Onaylayan kullanıcı (mevcut kullanıcı): ID=${req.user.id}, Telefon=${req.user.phoneNumber}, Adı=${req.user.name}`);

        // 1. İstek yapan kullanıcıyı (User A) telefon numarasından bul
        console.log(`İstek yapan kullanıcı aranıyor... Telefon: ${permissionRequest.requesterPhone}`);
        const requesterUser = await User.findOne({ phoneNumber: permissionRequest.requesterPhone });

        if (!requesterUser) {
          console.error(`HATA: ${permissionRequest.requesterPhone} numaralı istek yapan kullanıcı bulunamadı. İzinli numara eklenemedi.`);
          return next(new ErrorResponse(`İzin isteğini yapan ${permissionRequest.requesterPhone} numaralı kullanıcı sistemde bulunamadı. Bu nedenle izinli numara eklenemedi.`, 404));
        }
        console.log(`İstek yapan kullanıcı bulundu: ID=${requesterUser._id}, Adı=${requesterUser.name}, Telefon=${requesterUser.phoneNumber}`);

        // 2. Bu iznin (istek yapan kullanıcı için hedef numara) zaten var olup olmadığını kontrol et
        console.log(`Mevcut izin kontrolü yapılıyor... Kullanıcı (takip edecek): ${requesterUser._id}, Takip Edilecek Numara: ${permissionRequest.targetPhoneNumber}`);
        const existingAllowedNumber = await AllowedNumber.findOne({
          user: requesterUser._id, 
          phoneNumber: permissionRequest.targetPhoneNumber 
        });
        
        console.log(`Mevcut izin kontrolü sonucu: ${existingAllowedNumber ? 'Bu izin zaten mevcut.' : 'Bu izin henüz eklenmemiş.'}`);
        
        if (!existingAllowedNumber) {
          console.log('Yeni izin verilen numara oluşturuluyor...');
          const newAllowedNumber = new AllowedNumber({
            user: requesterUser._id, 
            phoneNumber: permissionRequest.targetPhoneNumber, 
            name: `İzinli: ${permissionRequest.targetPhoneNumber}`, 
            notes: `${new Date().toLocaleDateString('tr-TR')} tarihinde ${requesterUser.phoneNumber} (${requesterUser.name || 'Bilinmiyor'}) kullanıcısının isteği üzerine ${req.user.phoneNumber} (${req.user.name || 'Bilinmiyor'}) tarafından onaylandı.`
          });
          
          console.log(`Yeni izin verilen numara oluşturuldu (kaydetmeden önce):`, JSON.stringify(newAllowedNumber, null, 2));
          
          console.log('Yeni izin verilen numara veritabanına kaydediliyor...');
          try {
            await newAllowedNumber.save();
            console.log(`Başarıyla kaydedildi: ${newAllowedNumber.phoneNumber}, ${requesterUser.name} kullanıcısının izin listesine eklendi.`);
          } catch (saveError) {
            console.error('Yeni izin verilen numara kaydedilirken veritabanı hatası:', saveError);
            if (saveError.errors) {
              Object.keys(saveError.errors).forEach(key => {
                console.error(`  Alan: ${key}, Hata: ${saveError.errors[key].message}`);
              });
            }
            throw saveError; // Hata tekrar fırlatılıyor, dış catch bloğu yakalayacak
          }
        } else {
          console.log(`${permissionRequest.targetPhoneNumber} numarası zaten ${requesterUser.name} (${requesterUser.phoneNumber}) kullanıcısının izin verilenler listesinde bulunuyor.`);
        }
        console.log('==== İZİN VERİLEN NUMARA EKLEME İŞLEMİ TAMAMLANDI ====');
      } catch (allowedNumberError) {
        console.error('==== İZİN VERİLEN NUMARA EKLEME HATASI ====');
        console.error('İzin verilen numara eklenirken hata oluştu:', allowedNumberError);
        // Hatanın frontend'e bildirilmesi için next ile middleware'e gönderiyoruz.
        // Bu, işlemin geri kalanının (başarılı yanıt gönderme) çalışmasını engelleyecektir.
        return next(new ErrorResponse(`İzin verilen numara veritabanına kaydedilirken bir sorun oluştu: ${allowedNumberError.message}`, 500));
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
