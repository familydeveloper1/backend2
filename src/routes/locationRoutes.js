const express = require('express');
const {
  getDeviceLocations,
  getLatestDeviceLocation,
  createLocation,
  getNearbyDevices
} = require('../controllers/locationController');

const router = express.Router();

// Auth middleware
const { protect } = require('../middleware/auth');

// Konum ekleme route'u - cihaz API anahtarı ile erişilebilir
router.post('/', createLocation);

// Diğer tüm route'ları koruma altına al
router.use(protect);

// Yakındaki cihazları getir
router.get('/nearby', getNearbyDevices);

// Bir cihazın konumlarını getir
router.get('/device/:deviceId', getDeviceLocations);

// Bir cihazın son konumunu getir
router.get('/device/:deviceId/latest', getLatestDeviceLocation);

module.exports = router;
