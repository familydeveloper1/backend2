const mongoose = require('mongoose');
require('dotenv').config();
const AllowedNumber = require('../models/AllowedNumber');
const PermissionRequest = require('../models/PermissionRequest');
const User = require('../models/User');

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@loocc.xazxhlf.mongodb.net/loocc?retryWrites=true&w=majority';

async function fixPermissionController() {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB bağlantısı başarılı');
    
    // Kabul edilmiş izin isteklerini bul
    const acceptedRequests = await PermissionRequest.find({ status: 'accepted' });
    console.log(`Kabul edilmiş izin isteği sayısı: ${acceptedRequests.length}`);
    
    for (const request of acceptedRequests) {
      console.log(`\nİzin isteği işleniyor: ${request._id}`);
      console.log(`İstek sahibi tel: ${request.requesterPhone}, Hedef tel: ${request.targetPhoneNumber}`);
      
      // İstek sahibi kullanıcıyı bul
      const requesterUser = await User.findOne({ phoneNumber: request.requesterPhone });
      if (!requesterUser) {
        console.log(`HATA: ${request.requesterPhone} numaralı kullanıcı bulunamadı.`);
        continue;
      }
      
      console.log(`İstek sahibi kullanıcı: ID=${requesterUser._id}, Ad=${requesterUser.name}`);
      
      // Mevcut izin kontrolü
      const existingAllowedNumber = await AllowedNumber.findOne({
        user: requesterUser._id,
        phoneNumber: request.targetPhoneNumber
      });
      
      if (existingAllowedNumber) {
        console.log(`Bu izin zaten mevcut: ${existingAllowedNumber._id}`);
      } else {
        console.log('Yeni izin verilen numara oluşturuluyor...');
        
        // ÖNEMLİ: Burada düzeltme yapıldı - İstek sahibi kullanıcı için hedef telefon numarası izin veriliyor
        const newAllowedNumber = new AllowedNumber({
          user: requesterUser._id, // İstek sahibi kullanıcı (izni alan)
          phoneNumber: request.targetPhoneNumber, // Hedef telefon numarası (izin verilen)
          name: `İzinli: ${request.targetPhoneNumber}`,
          notes: `${new Date().toLocaleDateString('tr-TR')} tarihinde otomatik düzeltme ile eklendi.`
        });
        
        try {
          const savedRecord = await newAllowedNumber.save();
          console.log('Kayıt başarılı:', JSON.stringify(savedRecord, null, 2));
        } catch (saveError) {
          console.error('Kayıt hatası:', saveError);
        }
      }
    }
    
    // Düzeltme sonrası tüm izin verilen numaraları kontrol et
    const allAllowedNumbers = await AllowedNumber.find({});
    console.log(`\nToplam izin verilen numara sayısı: ${allAllowedNumbers.length}`);
    console.log('İzin verilen numaralar:', JSON.stringify(allAllowedNumbers, null, 2));
    
  } catch (err) {
    console.error('Genel hata:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

fixPermissionController();
