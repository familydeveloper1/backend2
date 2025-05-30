const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getPhoneLocations, 
  getLatestPhoneLocation, 
  createLocation, 
  getNearbyUsers 
} = require('../controllers/locationController');

// Telefon numarasına göre konum kaydetme
router.post('/', auth, createLocation);
router.post('/phone', auth, createLocation);

// Telefon numarasına göre son konumu getir
router.get('/phone/:phoneNumber/latest', auth, getLatestPhoneLocation);

// Telefon numarasına göre konum geçmişini getir
router.get('/phone/:phoneNumber', auth, getPhoneLocations);

// Yakındaki kullanıcıları bul
router.get('/nearby', auth, getNearbyUsers);

module.exports = router;
