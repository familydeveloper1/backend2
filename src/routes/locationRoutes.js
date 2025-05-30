const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const locationController = require('../controllers/locationController');

// Telefon numarasına göre konum kaydetme
router.post('/', auth, locationController.createLocation);
router.post('/phone', auth, locationController.createLocation);

// Telefon numarasına göre son konumu getir
router.get('/phone/:phoneNumber/latest', auth, locationController.getLatestPhoneLocation);

// Telefon numarasına göre konum geçmişini getir
router.get('/phone/:phoneNumber', auth, locationController.getPhoneLocations);

// Yakındaki kullanıcıları bul
router.get('/nearby', auth, locationController.getNearbyUsers);

module.exports = router;
