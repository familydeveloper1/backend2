const TrackedPhone = require('../models/TrackedPhone');
const User = require('../models/User');
const Location = require('../models/Location');

// Takip edilen telefon numarası ekle
exports.addTrackedPhone = async (req, res) => {
  try {
    const { phoneNumber, name } = req.body;
    const userId = req.user._id;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Telefon numarası gerekli'
      });
    }

    // Aynı telefon numarası zaten takip ediliyor mu kontrol et
    const existingPhone = await TrackedPhone.findOne({ userId, phoneNumber });
    if (existingPhone) {
      return res.status(200).json({
        success: true,
        message: 'Bu telefon numarası zaten takip ediliyor',
        data: existingPhone
      });
    }

    // Son konum bilgisini al
    const lastLocation = await Location.findOne({ phoneNumber })
      .sort({ timestamp: -1 })
      .limit(1);

    // Yeni takip edilen telefon oluştur
    const trackedPhone = new TrackedPhone({
      phoneNumber,
      name: name || `Telefon: ${phoneNumber}`,
      userId,
      lastLocation: lastLocation ? {
        latitude: lastLocation.coordinates.coordinates[1],
        longitude: lastLocation.coordinates.coordinates[0],
        timestamp: lastLocation.timestamp
      } : null
    });

    await trackedPhone.save();

    return res.status(201).json({
      success: true,
      message: 'Telefon numarası takip listesine eklendi',
      data: trackedPhone
    });
  } catch (error) {
    console.error('addTrackedPhone error:', error);
    return res.status(500).json({
      success: false,
      message: 'Telefon numarası eklenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Takip edilen telefon numaralarını getir
exports.getTrackedPhones = async (req, res) => {
  try {
    const userId = req.user._id;

    // Kullanıcının takip ettiği tüm telefonları bul
    const trackedPhones = await TrackedPhone.find({ userId });

    // Her telefon için son konum bilgisini al
    const phonesWithLocations = await Promise.all(
      trackedPhones.map(async (phone) => {
        const lastLocation = await Location.findOne({ phoneNumber: phone.phoneNumber })
          .sort({ timestamp: -1 })
          .limit(1);

        return {
          ...phone.toObject(),
          coordinate: lastLocation ? {
            latitude: lastLocation.coordinates.coordinates[1],
            longitude: lastLocation.coordinates.coordinates[0]
          } : null,
          lastUpdated: lastLocation ? lastLocation.timestamp : null
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: phonesWithLocations
    });
  } catch (error) {
    console.error('getTrackedPhones error:', error);
    return res.status(500).json({
      success: false,
      message: 'Takip edilen telefonlar getirilirken bir hata oluştu',
      error: error.message
    });
  }
};

// Takip edilen telefon numarasını sil
exports.removeTrackedPhone = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Telefon numarasının kullanıcıya ait olup olmadığını kontrol et
    const trackedPhone = await TrackedPhone.findOne({ _id: id, userId });
    if (!trackedPhone) {
      return res.status(404).json({
        success: false,
        message: 'Takip edilen telefon bulunamadı veya bu telefonu silme yetkiniz yok'
      });
    }

    // Telefon numarasını sil
    await TrackedPhone.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Telefon numarası takip listesinden silindi'
    });
  } catch (error) {
    console.error('removeTrackedPhone error:', error);
    return res.status(500).json({
      success: false,
      message: 'Telefon numarası silinirken bir hata oluştu',
      error: error.message
    });
  }
};

// Takip edilen telefon numarasının detaylarını getir
exports.getTrackedPhoneDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Telefon numarasının kullanıcıya ait olup olmadığını kontrol et
    const trackedPhone = await TrackedPhone.findOne({ _id: id, userId });
    if (!trackedPhone) {
      return res.status(404).json({
        success: false,
        message: 'Takip edilen telefon bulunamadı veya bu telefonu görüntüleme yetkiniz yok'
      });
    }

    // Son konum bilgisini al
    const lastLocation = await Location.findOne({ phoneNumber: trackedPhone.phoneNumber })
      .sort({ timestamp: -1 })
      .limit(1);

    const phoneWithLocation = {
      ...trackedPhone.toObject(),
      coordinate: lastLocation ? {
        latitude: lastLocation.coordinates.coordinates[1],
        longitude: lastLocation.coordinates.coordinates[0]
      } : null,
      lastUpdated: lastLocation ? lastLocation.timestamp : null
    };

    return res.status(200).json({
      success: true,
      data: phoneWithLocation
    });
  } catch (error) {
    console.error('getTrackedPhoneDetails error:', error);
    return res.status(500).json({
      success: false,
      message: 'Telefon detayları getirilirken bir hata oluştu',
      error: error.message
    });
  }
};
