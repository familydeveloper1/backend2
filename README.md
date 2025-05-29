# GPS Tracker Pro Backend API

Bu proje, GPS Tracker Pro mobil uygulaması için RESTful API sağlar. Node.js, Express ve MongoDB kullanılarak geliştirilmiştir.

## Özellikler

- Kullanıcı kaydı ve girişi (telefon numarası üzerinden)
- JWT tabanlı kimlik doğrulama
- Cihaz yönetimi (ekleme, silme, güncelleme)
- Konum izleme ve kaydetme
- Yakındaki cihazları bulma
- Konum geçmişi görüntüleme

## Yerel Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme modunda çalıştır
npm run dev

# Üretim modunda çalıştır
npm start
```

## Render.com'a Deployment

Bu proje Render.com'a kolayca deploy edilebilir. İşte adımlar:

1. [Render.com](https://render.com) üzerinde bir hesap oluşturun
2. "New Web Service" seçeneğine tıklayın
3. GitHub veya GitLab hesabınızı bağlayın ve bu repository'yi seçin
4. Aşağıdaki ayarları yapın:
   - **Name**: `gps-tracker-pro-api` (veya istediğiniz bir isim)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. "Advanced" bölümünde aşağıdaki çevresel değişkenleri ekleyin:
   - `MONGODB_URI`: MongoDB bağlantı adresiniz
   - `JWT_SECRET`: JWT token'ları için güvenli bir anahtar
   - `JWT_EXPIRE`: Token süresi (30d önerilir)
   - `NODE_ENV`: `production`
6. "Create Web Service" butonuna tıklayın

Alternatif olarak, bu repository'deki `render.yaml` dosyasını kullanarak "Blueprint" özelliği ile otomatik deployment yapabilirsiniz.

## Ortam Değişkenleri

Projenin kök dizininde bir `.env` dosyası oluşturun ve aşağıdaki değişkenleri ayarlayın:

```
MONGODB_URI=mongodb+srv://your_mongodb_uri
PORT=5001
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
NODE_ENV=development
```

**Not**: Render.com'da deploy ederken, bu değişkenleri Render dashboard'undan ayarlamalısınız.

## API Endpointleri

### Kullanıcı İşlemleri

- `POST /api/users/register` - Yeni kullanıcı kaydı (telefon numarası ile)
- `POST /api/users/login` - Kullanıcı girişi (telefon numarası ile)
- `GET /api/users/me` - Mevcut kullanıcı bilgilerini getir
- `PUT /api/users/me` - Kullanıcı bilgilerini güncelle
- `PUT /api/users/updatepassword` - Şifre güncelle

### Cihaz İşlemleri

- `GET /api/devices` - Tüm cihazları getir
- `GET /api/devices/:id` - Tek bir cihazı getir
- `POST /api/devices` - Yeni cihaz ekle
- `PUT /api/devices/:id` - Cihazı güncelle
- `DELETE /api/devices/:id` - Cihazı sil

### Konum İşlemleri

- `GET /api/locations/device/:deviceId` - Bir cihazın tüm konumlarını getir
- `GET /api/locations/device/:deviceId/latest` - Bir cihazın son konumunu getir
- `POST /api/locations` - Yeni konum ekle
- `GET /api/locations/nearby` - Belirli bir mesafe içindeki cihazları bul

## Mobil Uygulama Entegrasyonu

Bu API, GPS Tracker Pro mobil uygulaması ile çalışmak üzere tasarlanmıştır. Mobil uygulama, bu API'yi kullanarak cihazları yönetebilir ve konum verilerini takip edebilir.
