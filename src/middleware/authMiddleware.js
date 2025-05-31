const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT token doğrulama middleware'i
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Token'ı al
      token = req.headers.authorization.split(' ')[1];

      // Token'ı doğrula
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Kullanıcıyı bul ve şifreyi hariç tut
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Yetkilendirme başarısız, geçersiz token');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Yetkilendirme başarısız, token bulunamadı');
  }
};

// Admin kontrolü
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error('Yetkilendirme başarısız, admin değilsiniz');
  }
};

module.exports = { protect, admin };
