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

module.exports = router;
