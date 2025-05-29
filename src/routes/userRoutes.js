const express = require('express');
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword
} = require('../controllers/userController');

const router = express.Router();

// Auth middleware
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
