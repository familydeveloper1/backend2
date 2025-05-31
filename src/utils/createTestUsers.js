/**
 * Test kullanıcılarını veritabanında oluşturma script'i
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// .env dosyasını yükle
dotenv.config();

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://cannperk:plaka1616@cluster0.xazxhlf.mongodb.net/gps-tracker-pro?retryWrites=true&w=majority');
    console.log(`MongoDB Bağlantısı Başarılı: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Bağlantı Hatası: ${error.message}`);
    process.exit(1);
  }
};

// Test kullanıcılarını oluştur
const createTestUsers = async () => {
  try {
    await connectDB();
    
    // Şifre hash'leme
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test1234', salt);
    
    // Kullanıcı A
    const userAData = {
      _id: '65a1b2c3d4e5f6a7b8c9d0e1', // generateTestTokens.js ile aynı ID
      name: 'Test Kullanıcı A',
      email: 'test.a@example.com',
      phoneNumber: '5551112233', // + işareti olmadan telefon numarası
      password: hashedPassword,
      role: 'user',
      isActive: true
    };
    
    // Kullanıcı B
    const userBData = {
      _id: '75a1b2c3d4e5f6a7b8c9d0e2', // generateTestTokens.js ile aynı ID
      name: 'Test Kullanıcı B',
      email: 'test.b@example.com',
      phoneNumber: '5554445566', // + işareti olmadan telefon numarası
      password: hashedPassword,
      role: 'user',
      isActive: true
    };
    
    // Kullanıcıları veritabanına ekle veya güncelle
    console.log('Test kullanıcıları oluşturuluyor...');
    
    // Kullanıcı A için
    const existingUserA = await User.findOne({ phoneNumber: userAData.phoneNumber });
    if (existingUserA) {
      console.log(`Kullanıcı A (${userAData.phoneNumber}) zaten mevcut, güncelleniyor...`);
      await User.findOneAndUpdate(
        { phoneNumber: userAData.phoneNumber },
        userAData,
        { new: true }
      );
    } else {
      console.log(`Kullanıcı A (${userAData.phoneNumber}) oluşturuluyor...`);
      await User.create(userAData);
    }
    
    // Kullanıcı B için
    const existingUserB = await User.findOne({ phoneNumber: userBData.phoneNumber });
    if (existingUserB) {
      console.log(`Kullanıcı B (${userBData.phoneNumber}) zaten mevcut, güncelleniyor...`);
      await User.findOneAndUpdate(
        { phoneNumber: userBData.phoneNumber },
        userBData,
        { new: true }
      );
    } else {
      console.log(`Kullanıcı B (${userBData.phoneNumber}) oluşturuluyor...`);
      await User.create(userBData);
    }
    
    console.log('Test kullanıcıları başarıyla oluşturuldu!');
    
    // Kullanıcıları doğrula
    const userA = await User.findOne({ phoneNumber: userAData.phoneNumber });
    const userB = await User.findOne({ phoneNumber: userBData.phoneNumber });
    
    console.log('\n=== OLUŞTURULAN KULLANICILAR ===');
    console.log('\nKullanıcı A:');
    console.log(`ID: ${userA._id}`);
    console.log(`Ad: ${userA.name}`);
    console.log(`Telefon: ${userA.phoneNumber}`);
    
    console.log('\nKullanıcı B:');
    console.log(`ID: ${userB._id}`);
    console.log(`Ad: ${userB.name}`);
    console.log(`Telefon: ${userB.phoneNumber}`);
    
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('\nMongoDB bağlantısı kapatıldı.');
    
  } catch (error) {
    console.error('Test kullanıcıları oluşturulurken hata:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Script'i çalıştır
createTestUsers();
