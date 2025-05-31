const fs = require('fs');
const path = require('path');

// permissionController.js dosyasını oku
const controllerPath = path.join(__dirname, '../controllers/permissionController.js');
const controllerContent = fs.readFileSync(controllerPath, 'utf8');

// Daha detaylı hata ayıklama ekleyelim
const updatedContent = controllerContent.replace(
  /exports\.respondToPermissionRequest\s*=\s*async\s*\(req,\s*res,\s*next\)\s*=>\s*{/,
  `exports.respondToPermissionRequest = async (req, res, next) => {
  console.log('==== İZIN İSTEĞİ YANITLAMA BAŞLADI ====');
  console.log(\`İstek ID: \${req.params.id}\`);
  console.log(\`Request body:\`, JSON.stringify(req.body, null, 2));
  console.log(\`User:\`, JSON.stringify(req.user, null, 2));`
);

// Kabul kontrolünü düzeltelim
const updatedContent2 = updatedContent.replace(
  /const\s*{\s*accept\s*}\s*=\s*req\.body;/,
  `const { accept, status } = req.body;
    // status parametresi varsa onu kullan, yoksa accept parametresini kullan
    const isAccepted = status === 'accepted' ? true : (accept === true);
    
    console.log(\`İzin isteği yanıtı: \${isAccepted ? 'KABUL' : 'RED'}\`);`
);

// accept değişkenini isAccepted ile değiştirelim
const updatedContent3 = updatedContent2.replace(
  /console\.log\(\`İzin isteği durumu güncelleniyor: \${accept \? 'accepted' : 'rejected'}\`\);/g,
  `console.log(\`İzin isteği durumu güncelleniyor: \${isAccepted ? 'accepted' : 'rejected'}\`);`
);

const updatedContent4 = updatedContent3.replace(
  /permissionRequest\.status = accept \? 'accepted' : 'rejected';/g,
  `permissionRequest.status = isAccepted ? 'accepted' : 'rejected';`
);

const updatedContent5 = updatedContent4.replace(
  /if \(accept\) {/g,
  `if (isAccepted) {`
);

const updatedContent6 = updatedContent5.replace(
  /message: accept \? 'İzin isteği kabul edildi' : 'İzin isteği reddedildi',/g,
  `message: isAccepted ? 'İzin isteği kabul edildi' : 'İzin isteği reddedildi',`
);

// AllowedNumber oluşturma kodunu daha detaylı hale getirelim
const updatedContent7 = updatedContent6.replace(
  /const newAllowedNumber = new AllowedNumber\({[\s\S]*?\}\);/,
  `console.log('AllowedNumber şeması:', Object.keys(AllowedNumber.schema.paths));
          
          const newAllowedNumber = new AllowedNumber({
            user: requesterUser._id, 
            phoneNumber: permissionRequest.targetPhoneNumber, 
            name: \`İzinli: \${permissionRequest.targetPhoneNumber}\`, 
            notes: \`\${new Date().toLocaleDateString('tr-TR')} tarihinde \${requesterUser.phoneNumber} (\${requesterUser.name || 'Bilinmiyor'}) kullanıcısının isteği üzerine \${req.user.phoneNumber} (\${req.user.name || 'Bilinmiyor'}) tarafından onaylandı.\`
          });
          
          console.log(\`Yeni izin verilen numara oluşturuldu (kaydetmeden önce):\`, JSON.stringify(newAllowedNumber, null, 2));
          console.log(\`Yeni izin verilen numara validasyon sonucu:\`, newAllowedNumber.validateSync() ? 'HATALI' : 'GEÇERLİ');
          
          if (newAllowedNumber.validateSync()) {
            console.error('Validasyon hatası:', newAllowedNumber.validateSync());
          }`
);

// save işlemini daha detaylı hale getirelim
const updatedContent8 = updatedContent7.replace(
  /await newAllowedNumber\.save\(\);/,
  `const savedAllowedNumber = await newAllowedNumber.save();
            console.log(\`Başarıyla kaydedildi: \${savedAllowedNumber.phoneNumber}, \${requesterUser.name} kullanıcısının izin listesine eklendi.\`);
            console.log('Kaydedilen veri:', JSON.stringify(savedAllowedNumber, null, 2));`
);

// Genel hata yakalama ekleyelim
const updatedContent9 = updatedContent8.replace(
  /} catch \(err\) {\s*next\(err\);\s*}/,
  `} catch (err) {
    console.error('Genel hata:', err);
    next(err);
  }`
);

// Güncellenmiş içeriği kaydet
fs.writeFileSync(controllerPath, updatedContent9);
console.log('permissionController.js dosyası başarıyla güncellendi.');
