/**
 * Test için JWT token oluşturma script'i
 * İki farklı kullanıcı için token oluşturur
 */

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// .env dosyasını yükle
dotenv.config();

// Kullanıcı A için token oluştur
const userA = {
  id: '65a1b2c3d4e5f6a7b8c9d0e1', // MongoDB ObjectId formatında bir ID (örnek)
  name: 'Test Kullanıcı A',
  phoneNumber: '5551112233', // Test telefon numarası A
};

// Kullanıcı B için token oluştur
const userB = {
  id: '75a1b2c3d4e5f6a7b8c9d0e2', // MongoDB ObjectId formatında bir ID (örnek)
  name: 'Test Kullanıcı B',
  phoneNumber: '5554445566', // Test telefon numarası B
};

// JWT Secret ve süresini .env'den al
const JWT_SECRET = process.env.JWT_SECRET || 'gps_tracker_pro_secret_key_2025';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';

// Token oluştur
const tokenA = jwt.sign({ id: userA.id }, JWT_SECRET, {
  expiresIn: JWT_EXPIRE
});

const tokenB = jwt.sign({ id: userB.id }, JWT_SECRET, {
  expiresIn: JWT_EXPIRE
});

console.log('=== TEST İÇİN JWT TOKEN BİLGİLERİ ===');
console.log('\nKullanıcı A:');
console.log(`ID: ${userA.id}`);
console.log(`Ad: ${userA.name}`);
console.log(`Telefon: ${userA.phoneNumber}`);
console.log(`Token: ${tokenA}`);

console.log('\nKullanıcı B:');
console.log(`ID: ${userB.id}`);
console.log(`Ad: ${userB.name}`);
console.log(`Telefon: ${userB.phoneNumber}`);
console.log(`Token: ${tokenB}`);

console.log('\n=== TEST CURL KOMUTLARI ===');
console.log('\n1. Kullanıcı A\'dan Kullanıcı B\'ye izin isteği gönder:');
console.log(`curl -X POST https://backend2-403g.onrender.com/api/permissions/request \\
-H "Authorization: Bearer ${tokenA}" \\
-H "Content-Type: application/json" \\
-d '{
  "targetPhoneNumber": "${userB.phoneNumber}"
}'`);

console.log('\n2. İzin isteğini kabul et (REQUEST_ID\'yi gerçek değerle değiştirin):');
console.log(`curl -X PUT https://backend2-403g.onrender.com/api/permissions/request/REQUEST_ID \\
-H "Authorization: Bearer ${tokenB}" \\
-H "Content-Type: application/json" \\
-d '{
  "status": "accepted"
}'`);

console.log('\n3. Kullanıcı A\'nın izin verilen numaralarını kontrol et:');
console.log(`curl -X GET https://backend2-403g.onrender.com/api/permissions/allowed-numbers \\
-H "Authorization: Bearer ${tokenA}"`);
