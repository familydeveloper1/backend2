const express = require('express');
const {
  getDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice
} = require('../controllers/deviceController');

const router = express.Router();

// Auth middleware
const { protect } = require('../middleware/auth');

// Tüm route'ları koruma altına al
router.use(protect);

router
  .route('/')
  .get(getDevices)
  .post(createDevice);

router
  .route('/:id')
  .get(getDevice)
  .put(updateDevice)
  .delete(deleteDevice);

module.exports = router;
