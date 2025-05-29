const express = require('express');
const {
  getDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice
} = require('../controllers/deviceController');

const {
  getAllowedNumbers,
  addAllowedNumber,
  removeAllowedNumber,
  requestDevicePermission,
  getPermissionRequests,
  respondToPermissionRequest,
  checkTrackingPermission
} = require('../controllers/permissionController');

const router = express.Router();

// Auth middleware
const { protect } = require('../middleware/auth');

// Tüm route'ları koruma altına al
router.use(protect);

// Özel route handler - ID olarak yorumlanmasını önlemek için
router.use('/:id', (req, res, next) => {
  // Eğer id, özel bir endpoint ise, bir sonraki route handler'a geç
  if (['allowed-numbers-list', 'allowed-numbers-add', 'permissions-list', 'permissions-request'].includes(req.params.id)) {
    return next('route');
  }
  // Değilse, normal akışa devam et
  next();
});

// Temel cihaz işlemleri
router
  .route('/')
  .get(getDevices)
  .post(createDevice);

router
  .route('/:id')
  .get(getDevice)
  .put(updateDevice)
  .delete(deleteDevice);

// İzin verilen numaralar
router.get('/allowed-numbers-list', getAllowedNumbers);
router.post('/allowed-numbers-add', addAllowedNumber);
router.delete('/allowed-numbers-remove/:id', removeAllowedNumber);

// İzin istekleri
router.get('/permissions-list', getPermissionRequests);
router.post('/permissions-request', requestDevicePermission);
router.put('/permissions-respond/:id', respondToPermissionRequest);

// İzin durumu kontrolü
router.get('/check-permission/:deviceId', checkTrackingPermission);

module.exports = router;
