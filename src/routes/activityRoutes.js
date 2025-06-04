const express = require('express');
const { body, param } = require('express-validator');
const activityController = require('../controllers/activityController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Tüm rotalar için kimlik doğrulama gerekli
router.use(authMiddleware.protect);

/**
 * @route POST /api/activities/start
 * @desc Yeni bir aktivite başlatır
 * @access Private
 */
router.post('/start', [
  body('userId').notEmpty().withMessage('Kullanıcı ID gerekli'),
  body('phoneNumber').notEmpty().withMessage('Telefon numarası gerekli'),
  body('type').isIn(['walking', 'running', 'cycling', 'driving', 'other']).withMessage('Geçersiz aktivite türü')
], activityController.startActivity);

/**
 * @route PUT /api/activities/:activityId/stop
 * @desc Aktif bir aktiviteyi durdurur
 * @access Private
 */
router.put('/:activityId/stop', [
  param('activityId').isMongoId().withMessage('Geçersiz aktivite ID'),
  body('distance').optional().isNumeric().withMessage('Mesafe sayısal olmalı'),
  body('calories').optional().isNumeric().withMessage('Kalori sayısal olmalı'),
  body('avgSpeed').optional().isNumeric().withMessage('Ortalama hız sayısal olmalı'),
  body('maxSpeed').optional().isNumeric().withMessage('Maksimum hız sayısal olmalı')
], activityController.stopActivity);

/**
 * @route POST /api/activities/:activityId/location
 * @desc Aktiviteye konum ekler
 * @access Private
 */
router.post('/:activityId/location', [
  param('activityId').isMongoId().withMessage('Geçersiz aktivite ID'),
  body('latitude').isNumeric().withMessage('Enlem sayısal olmalı'),
  body('longitude').isNumeric().withMessage('Boylam sayısal olmalı'),
  body('speed').optional().isNumeric().withMessage('Hız sayısal olmalı'),
  body('altitude').optional().isNumeric().withMessage('Yükseklik sayısal olmalı')
], activityController.addLocationToActivity);

/**
 * @route GET /api/activities/user/:userId
 * @desc Kullanıcının aktivitelerini listeler
 * @access Private
 */
router.get('/user/:userId', [
  param('userId').notEmpty().withMessage('Kullanıcı ID gerekli')
], activityController.getUserActivities);

/**
 * @route GET /api/activities/user/:userId/phone/:phoneNumber
 * @desc Belirli bir telefon numarasının aktivitelerini listeler
 * @access Private
 */
router.get('/user/:userId/phone/:phoneNumber', [
  param('userId').notEmpty().withMessage('Kullanıcı ID gerekli'),
  param('phoneNumber').notEmpty().withMessage('Telefon numarası gerekli')
], activityController.getUserActivities);

/**
 * @route GET /api/activities/:activityId
 * @desc Belirli bir aktivitenin detaylarını getirir
 * @access Private
 */
router.get('/:activityId', [
  param('activityId').isMongoId().withMessage('Geçersiz aktivite ID')
], activityController.getActivityDetails);

/**
 * @route PUT /api/activities/:activityId
 * @desc Aktivite istatistiklerini günceller
 * @access Private
 */
router.put('/:activityId', [
  param('activityId').isMongoId().withMessage('Geçersiz aktivite ID'),
  body('distance').optional().isNumeric().withMessage('Mesafe sayısal olmalı'),
  body('duration').optional().isNumeric().withMessage('Süre sayısal olmalı'),
  body('calories').optional().isNumeric().withMessage('Kalori sayısal olmalı'),
  body('avgSpeed').optional().isNumeric().withMessage('Ortalama hız sayısal olmalı'),
  body('maxSpeed').optional().isNumeric().withMessage('Maksimum hız sayısal olmalı'),
  body('type').optional().isIn(['walking', 'running', 'cycling', 'driving', 'other']).withMessage('Geçersiz aktivite türü'),
  body('notes').optional().isString().withMessage('Notlar metin olmalı')
], activityController.updateActivityStats);

/**
 * @route DELETE /api/activities/:activityId
 * @desc Bir aktiviteyi siler
 * @access Private
 */
router.delete('/:activityId', [
  param('activityId').isMongoId().withMessage('Geçersiz aktivite ID')
], activityController.deleteActivity);

/**
 * @route GET /api/activities/summary/user/:userId
 * @desc Kullanıcının aktivite özetini getirir
 * @access Private
 */
router.get('/summary/user/:userId', [
  param('userId').notEmpty().withMessage('Kullanıcı ID gerekli')
], activityController.getActivitySummary);

/**
 * @route GET /api/activities/summary/user/:userId/phone/:phoneNumber
 * @desc Belirli bir telefon numarasının aktivite özetini getirir
 * @access Private
 */
router.get('/summary/user/:userId/phone/:phoneNumber', [
  param('userId').notEmpty().withMessage('Kullanıcı ID gerekli'),
  param('phoneNumber').notEmpty().withMessage('Telefon numarası gerekli')
], activityController.getActivitySummary);

/**
 * @route DELETE /api/activities/user/:userId
 * @desc Kullanıcıya ait tüm aktiviteleri siler
 * @access Private
 */
router.delete('/user/:userId', [
  param('userId').notEmpty().withMessage('Kullanıcı ID gerekli')
], async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Yetki kontrolü - kullanıcı kendisi mi veya admin mi?
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Bu kullanıcının aktivitelerini silme yetkiniz yok'
      });
    }
    
    // Aktivite modelini import et
    const Activity = require('../models/Activity');
    
    // Kullanıcıya ait tüm aktiviteleri sil
    const result = await Activity.deleteMany({ user: userId });
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} aktivite başarıyla silindi`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Aktiviteler silinirken hata:', err);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

/**
 * @route DELETE /api/activities/phone/:phoneNumber
 * @desc Telefon numarasına ait tüm aktiviteleri siler
 * @access Private
 */
router.delete('/phone/:phoneNumber', [
  param('phoneNumber').notEmpty().withMessage('Telefon numarası gerekli')
], async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    // Yetki kontrolü - kullanıcı kendisi mi veya admin mi?
    if (req.user.phoneNumber !== phoneNumber && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Bu telefon numarasının aktivitelerini silme yetkiniz yok'
      });
    }
    
    // Aktivite modelini import et
    const Activity = require('../models/Activity');
    
    // Telefon numarasına ait tüm aktiviteleri sil
    const result = await Activity.deleteMany({ phoneNumber: phoneNumber });
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} aktivite başarıyla silindi`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Aktiviteler silinirken hata:', err);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

module.exports = router;
