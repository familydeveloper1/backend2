const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB bağlantısı başarılı: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB bağlantı hatası: ${error.message}`);
    process.exit(1);
  }
};

// Create a simple User schema for testing
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lütfen isim giriniz'],
    trim: true,
    maxlength: [50, 'İsim 50 karakterden uzun olamaz']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Lütfen telefon numarası giriniz'],
    unique: true,
    match: [
      /^[0-9]{10,15}$/,
      'Lütfen geçerli bir telefon numarası giriniz (10-15 rakam)'
    ]
  },
  password: {
    type: String,
    required: [true, 'Lütfen şifre giriniz'],
    minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Şifreyi hashleme
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// JWT token oluşturma
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Şifre karşılaştırma
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

// Ana sayfa route'u
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Test API çalışıyor',
    version: '1.0.0'
  });
});

// Kullanıcı kaydı
app.post('/api/users/register', async (req, res) => {
  try {
    console.log('Register endpoint çağrıldı');
    console.log('Request body:', req.body);
    
    const { name, phoneNumber, password } = req.body;

    // Kullanıcı oluştur
    const user = await User.create({
      name,
      phoneNumber,
      password
    });

    // Token oluştur
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (err) {
    console.error('Kayıt hatası:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// Kullanıcı girişi
app.post('/api/users/login', async (req, res) => {
  try {
    console.log('Login endpoint çağrıldı');
    console.log('Request body:', req.body);
    
    const { phoneNumber, password } = req.body;

    // Telefon numarası ve şifre kontrolü
    if (!phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        error: 'Lütfen telefon numarası ve şifre giriniz'
      });
    }

    // Kullanıcıyı kontrol et
    const user = await User.findOne({ phoneNumber }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz kimlik bilgileri'
      });
    }

    // Şifre kontrolü
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz kimlik bilgileri'
      });
    }

    // Token oluştur
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (err) {
    console.error('Giriş hatası:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// Tüm kullanıcıları getir (test için)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    console.error('Kullanıcı listesi hatası:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// Start server
const startServer = async () => {
  await connectDB();
  
  const PORT = 5001; // Original API uses 5000, we'll use 5001 for testing
  app.listen(PORT, () => {
    console.log(`Test API sunucusu ${PORT} portunda çalışıyor`);
  });
};

startServer();
