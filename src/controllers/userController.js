const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Kullanıcı kaydı
// @route   POST /api/users/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    console.log('Register endpoint çağrıldı');
    console.log('Request body:', req.body);
    
    const { name, phoneNumber, password } = req.body;

    // Gerekli alanları kontrol et
    if (!name || !phoneNumber || !password) {
      console.log('Eksik alanlar:', { name, phoneNumber, password: password ? 'Var' : 'Yok' });
      return next(new ErrorResponse('Lütfen tüm alanları doldurunuz', 400));
    }

    // Kullanıcı oluştur
    const user = await User.create({
      name,
      phoneNumber,
      password
    });

    console.log('Kullanıcı başarıyla oluşturuldu:', user._id);
    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error('Kayıt hatası:', err.message);
    next(err);
  }
};

// @desc    Kullanıcı girişi
// @route   POST /api/users/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    console.log('Login endpoint çağrıldı');
    console.log('Request body:', req.body);
    
    const { phoneNumber, password } = req.body;

    // Telefon numarası ve şifre kontrolü
    if (!phoneNumber || !password) {
      console.log('Eksik giriş bilgileri');
      return next(new ErrorResponse('Lütfen telefon numarası ve şifre giriniz', 400));
    }

    // Kullanıcıyı kontrol et
    const user = await User.findOne({ phoneNumber }).select('+password');

    if (!user) {
      console.log('Kullanıcı bulunamadı:', phoneNumber);
      return next(new ErrorResponse('Geçersiz kimlik bilgileri', 401));
    }

    // Şifre kontrolü
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log('Şifre eşleşmiyor:', phoneNumber);
      return next(new ErrorResponse('Geçersiz kimlik bilgileri', 401));
    }

    console.log('Kullanıcı girişi başarılı:', user._id);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Giriş hatası:', err.message);
    next(err);
  }
};

// @desc    Mevcut kullanıcı bilgilerini getir
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    console.log('GetMe endpoint çağrıldı, kullanıcı ID:', req.user.id);
    
    const user = await User.findById(req.user.id).populate('devices');
    
    if (!user) {
      console.log('Kullanıcı bulunamadı:', req.user.id);
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
    }
    
    console.log('Kullanıcı bilgileri başarıyla getirildi');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('GetMe hatası:', err.message);
    next(err);
  }
};

// @desc    Kullanıcı bilgilerini güncelle
// @route   PUT /api/users/me
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    console.log('UpdateDetails endpoint çağrıldı, kullanıcı ID:', req.user.id);
    console.log('Güncellenecek alanlar:', req.body);
    
    const fieldsToUpdate = {
      name: req.body.name,
      phoneNumber: req.body.phoneNumber
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    if (!user) {
      console.log('Kullanıcı bulunamadı:', req.user.id);
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
    }

    console.log('Kullanıcı bilgileri başarıyla güncellendi');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('UpdateDetails hatası:', err.message);
    next(err);
  }
};

// @desc    Şifre güncelle
// @route   PUT /api/users/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    console.log('UpdatePassword endpoint çağrıldı, kullanıcı ID:', req.user.id);
    
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      console.log('Kullanıcı bulunamadı:', req.user.id);
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
    }

    // Mevcut şifreyi kontrol et
    if (!(await user.matchPassword(req.body.currentPassword))) {
      console.log('Mevcut şifre eşleşmiyor');
      return next(new ErrorResponse('Mevcut şifre yanlış', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    console.log('Kullanıcı şifresi başarıyla güncellendi');
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('UpdatePassword hatası:', err.message);
    next(err);
  }
};

// Token oluştur ve gönder
const sendTokenResponse = (user, statusCode, res) => {
  // Token oluştur
  const token = user.getSignedJwtToken();

  console.log('Token oluşturuldu ve gönderiliyor');
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role
    }
  });
};
