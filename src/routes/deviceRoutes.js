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
router
  .route('/allowed-numbers')
  .get(getAllowedNumbers)
  .post(addAllowedNumber);

router.delete('/allowed-numbers/:id', removeAllowedNumber);

// İzin istekleri
router
  .route('/permissions')
  .get(getPermissionRequests)
  .post(requestDevicePermission);

router.put('/permissions/:id', respondToPermissionRequest);

// İzin durumu kontrolü
router.get('/check-permission/:deviceId', checkTrackingPermission);

module.exports = router;
