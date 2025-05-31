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

module.exports = router;
