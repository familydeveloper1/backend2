const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Kullanıcı kimlik doğrulama middleware'i
exports.protect = async (req, res, next) => {
  let token;

  // Token'ı header'dan al
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Token yoksa hata döndür
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Bu işlem için giriş yapmanız gerekiyor'
    });
  }

  try {
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kullanıcıyı bul
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Geçersiz token'
    });
  }
};

// Rol bazlı yetkilendirme
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Bu işlem için yetkiniz yok'
      });
    }
    next();
  };
};
