const express = require('express');
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword
} = require('../controllers/userController');

const router = express.Router();

// Auth middleware
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

/**
 * @route DELETE /api/users/phone/:phoneNumber
 * @desc Telefon numarasına göre kullanıcıyı sil
 * @access Private
 */
router.delete('/phone/:phoneNumber', protect, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    // Yetki kontrolü - kullanıcı kendisi mi veya admin mi?
    if (req.user.phoneNumber !== phoneNumber && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Bu telefon numarasına sahip kullanıcıyı silme yetkiniz yok'
      });
    }
    
    // User modelini import et
    const User = require('../models/User');
    
    // Telefon numarasına göre kullanıcıyı sil
    const result = await User.deleteOne({ phoneNumber });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bu telefon numarasına sahip kullanıcı bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Kullanıcı başarıyla silindi',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Kullanıcı silinirken hata:', err);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

module.exports = router;
