const express = require('express');
const {
  getAllowedNumbers,
  addAllowedNumber,
  removeAllowedNumber,
  requestPhonePermission,
  getPermissionRequests,
  respondToPermissionRequest,
  checkTrackingPermission
} = require('../controllers/permissionController');

const router = express.Router();

// Auth middleware
const { protect } = require('../middleware/auth');

// Tüm route'ları koruma altına al
router.use(protect);

// İzin verilen numaralar
router.get('/allowed-numbers', getAllowedNumbers);
router.post('/allowed-numbers', addAllowedNumber);
router.delete('/allowed-numbers/:id', removeAllowedNumber);

// İzin istekleri
router.get('/requests', getPermissionRequests);
router.post('/request', requestPhonePermission);
router.put('/request/:id', respondToPermissionRequest);

// İzin durumu kontrolü - telefon numarası tabanlı sistem için güncellendi
router.get('/check/phone/:phoneNumber', checkTrackingPermission);

// Telefon numarasına göre izin isteklerini sil
router.delete('/phone/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    // Yetki kontrolü - kullanıcı kendisi mi veya admin mi?
    if (req.user.phoneNumber !== phoneNumber && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Bu telefon numarasına ait izin isteklerini silme yetkiniz yok'
      });
    }
    
    const PermissionRequest = require('../models/PermissionRequest');
    
    // Hem istek yapan hem de hedef olarak telefon numarasına ait tüm izin isteklerini sil
    const result = await PermissionRequest.deleteMany({
      $or: [
        { requesterPhone: phoneNumber },
        { targetPhoneNumber: phoneNumber }
      ]
    });
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} izin isteği başarıyla silindi`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('İzin istekleri silinirken hata:', err);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

module.exports = router;
