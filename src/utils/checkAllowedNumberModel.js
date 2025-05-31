const mongoose = require('mongoose');
require('dotenv').config();
const AllowedNumber = require('../models/AllowedNumber');

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@loocc.xazxhlf.mongodb.net/loocc?retryWrites=true&w=majority';

async function checkAllowedNumberModel() {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB bağlantısı başarılı');
    
    // AllowedNumber modelinin şemasını kontrol et
    console.log('AllowedNumber şema yolları:', Object.keys(AllowedNumber.schema.paths));
    console.log('AllowedNumber koleksiyon adı:', AllowedNumber.collection.name);
    
    // Manuel olarak bir AllowedNumber kaydı oluştur
    const testAllowedNumber = new AllowedNumber({
      user: '65a1b2c3d4e5f6a7b8c9d0e1', // Test Kullanıcı A'nın ID'si
      phoneNumber: '5554445566', // Test Kullanıcı B'nin telefon numarası
      name: 'Test İzin',
      notes: 'Manuel test kaydı'
    });
    
    // Validasyon kontrolü
    const validationError = testAllowedNumber.validateSync();
    if (validationError) {
      console.error('Validasyon hatası:', validationError);
    } else {
      console.log('Validasyon başarılı');
      
      // Veritabanına kaydet
      try {
        const savedRecord = await testAllowedNumber.save();
        console.log('Kayıt başarılı:', JSON.stringify(savedRecord, null, 2));
      } catch (saveError) {
        console.error('Kayıt hatası:', saveError);
      }
    }
    
  } catch (err) {
    console.error('MongoDB bağlantı hatası:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

checkAllowedNumberModel();
