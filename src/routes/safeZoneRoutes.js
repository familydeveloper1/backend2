const express = require('express');
const router = express.Router();
const safeZoneController = require('../controllers/safeZoneController');
const { protect } = require('../middleware/authMiddleware');

// Tüm rotaları koruma altına al
router.use(protect);

// Güvenli bölge rotaları
router.route('/')
  .get(safeZoneController.getSafeZones)
  .post(safeZoneController.createSafeZone);

router.route('/:id')
  .put(safeZoneController.updateSafeZone)
  .delete(safeZoneController.deleteSafeZone);

router.route('/phone/:phoneNumber')
  .get(safeZoneController.getSafeZonesByPhone);

router.route('/events/:id')
  .get(safeZoneController.getZoneEvents);

router.route('/check-location')
  .post(safeZoneController.checkLocation);

module.exports = router;
