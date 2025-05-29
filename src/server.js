const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Route imports
const locationRoutes = require('./routes/locationRoutes');
const userRoutes = require('./routes/userRoutes');
const deviceRoutes = require('./routes/deviceRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: '*', // Tüm originlere izin ver (geliştirme için)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request body parsing middleware
app.use(bodyParser.json());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/locations', locationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);

// Ana sayfa route'u
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'GPS Tracker Pro API çalışıyor',
    version: '1.0.0'
  });
});

// Test endpoint to verify API is working
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API test endpoint çalışıyor',
    timestamp: new Date().toISOString()
  });
});

// 404 - Route bulunamadı
app.use((req, res, next) => {
  console.log(`404 - Route bulunamadı: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Sayfa bulunamadı'
  });
});

// Error handler
app.use(errorHandler);

// Port dinleme
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
  
  // Yerel ortamda ise URL'leri göster
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Ana sayfa: http://localhost:${PORT}`);
    console.log(`API test: http://localhost:${PORT}/api/test`);
    console.log(`Kullanıcı kaydı: http://localhost:${PORT}/api/users/register`);
  } else {
    console.log('Uygulama production modunda çalışıyor');
  }
});

// Beklenmeyen hataları yakala
process.on('unhandledRejection', (err, promise) => {
  console.log(`Hata: ${err.message}`);
  console.log(err.stack);
  // Sunucuyu kapat ve process'i sonlandır
  server.close(() => process.exit(1));
});

module.exports = app;
