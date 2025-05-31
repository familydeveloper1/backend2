const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@loocc.xazxhlf.mongodb.net/loocc?retryWrites=true&w=majority';

async function checkDatabase() {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB bağlantısı başarılı');
    
    // AllowedNumber koleksiyonunu kontrol et
    const allowedNumbers = await mongoose.connection.db.collection('allowednumbers').find({}).toArray();
    console.log('AllowedNumber koleksiyonu içeriği:', JSON.stringify(allowedNumbers, null, 2));
    
    // PermissionRequest koleksiyonunu kontrol et
    const permissionRequests = await mongoose.connection.db.collection('permissionrequests').find({}).toArray();
    console.log('PermissionRequest koleksiyonu içeriği:', JSON.stringify(permissionRequests, null, 2));
    
    // Kullanıcıları kontrol et
    const users = await mongoose.connection.db.collection('users').find({
      $or: [
        { phoneNumber: '5551112233' },
        { phoneNumber: '5554445566' }
      ]
    }).toArray();
    console.log('Test kullanıcıları:', JSON.stringify(users, null, 2));
    
  } catch (err) {
    console.error('MongoDB bağlantı hatası:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

checkDatabase();
