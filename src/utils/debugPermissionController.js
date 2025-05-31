// Bu script, permissionController.js içindeki respondToPermissionRequest fonksiyonunda
// AllowedNumber kaydının neden oluşturulamadığını tespit etmek için kullanılır

const fs = require('fs');
const path = require('path');

// permissionController.js dosyasını oku
const controllerPath = path.join(__dirname, '../controllers/permissionController.js');
const controllerContent = fs.readFileSync(controllerPath, 'utf8');

// respondToPermissionRequest fonksiyonunu bul
const functionRegex = /exports\.respondToPermissionRequest\s*=\s*async\s*\(req,\s*res,\s*next\)\s*=>\s*{[\s\S]*?};/;
const functionMatch = controllerContent.match(functionRegex);

if (functionMatch) {
  const functionCode = functionMatch[0];
  
  console.log('respondToPermissionRequest fonksiyonu analizi:');
  
  // AllowedNumber kullanımını kontrol et
  const allowedNumberUsage = functionCode.match(/AllowedNumber\./g);
  console.log(`AllowedNumber kullanım sayısı: ${allowedNumberUsage ? allowedNumberUsage.length : 0}`);
  
  // Telefon numarası kullanımını kontrol et
  console.log('\nTelefon numarası kullanımı:');
  const phoneNumberUsages = [
    { pattern: /requesterPhone/g, description: 'requesterPhone' },
    { pattern: /targetPhoneNumber/g, description: 'targetPhoneNumber' },
    { pattern: /ownerPhoneNumber/g, description: 'ownerPhoneNumber' }
  ];
  
  phoneNumberUsages.forEach(usage => {
    const matches = functionCode.match(usage.pattern);
    console.log(`${usage.description} kullanım sayısı: ${matches ? matches.length : 0}`);
  });
  
  // AllowedNumber oluşturma kodunu kontrol et
  console.log('\nAllowedNumber oluşturma kodu:');
  const createRegex = /new\s+AllowedNumber\(\{[\s\S]*?\}\)/;
  const createMatch = functionCode.match(createRegex);
  
  if (createMatch) {
    console.log(createMatch[0]);
    
    // phoneNumber alanını kontrol et
    const phoneNumberFieldRegex = /phoneNumber:\s*(.*),/;
    const phoneNumberFieldMatch = createMatch[0].match(phoneNumberFieldRegex);
    
    if (phoneNumberFieldMatch) {
      console.log(`\nphoneNumber alanı: ${phoneNumberFieldMatch[1]}`);
      
      // Sorun tespiti: targetPhoneNumber yerine requesterPhone kullanılmış olabilir
      if (phoneNumberFieldMatch[1].includes('requesterPhone')) {
        console.log('\nSORUN TESPİT EDİLDİ: AllowedNumber oluşturulurken targetPhoneNumber yerine requesterPhone kullanılmış!');
        console.log('Bu, izin isteği kabul edildiğinde yanlış telefon numarasının izin verilen numaralar listesine eklenmesine neden olur.');
      }
    }
  } else {
    console.log('AllowedNumber oluşturma kodu bulunamadı.');
  }
  
  // Düzeltme önerisi
  console.log('\nDüzeltme önerisi:');
  console.log(`
  const newAllowedNumber = new AllowedNumber({
    user: requesterUser._id, 
    phoneNumber: permissionRequest.targetPhoneNumber,  // Doğru olan bu! (requesterPhone değil)
    name: \`İzinli: \${permissionRequest.targetPhoneNumber}\`, 
    notes: \`\${new Date().toLocaleDateString('tr-TR')} tarihinde \${requesterUser.phoneNumber} (\${requesterUser.name || 'Bilinmiyor'}) kullanıcısının isteği üzerine \${req.user.phoneNumber} (\${req.user.name || 'Bilinmiyor'}) tarafından onaylandı.\`
  });
  `);
} else {
  console.log('respondToPermissionRequest fonksiyonu bulunamadı.');
}
