const express = require('express');
const router = express.Router();
const trackedPhoneController = require('../controllers/trackedPhoneController');
const auth = require('../middleware/auth');

// Tüm route'lar için kimlik doğrulama gerekli
router.use(auth);

// Takip edilen telefon numarası ekle
router.post('/', trackedPhoneController.addTrackedPhone);

// Takip edilen telefon numaralarını getir
router.get('/', trackedPhoneController.getTrackedPhones);

// Takip edilen telefon numarasını sil
router.delete('/:id', trackedPhoneController.removeTrackedPhone);

// Takip edilen telefon numarasının detaylarını getir
router.get('/:id', trackedPhoneController.getTrackedPhoneDetails);

// Telefon numarasına göre takip edilen telefonları sil
router.delete('/phone/:phoneNumber', trackedPhoneController.deleteByPhoneNumber);

module.exports = router;
