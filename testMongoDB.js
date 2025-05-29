const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB bağlantısı başarılı: ${conn.connection.host}`);
    
    // Create a simple test schema and model
    const TestSchema = new mongoose.Schema({
      name: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    });
    
    const Test = mongoose.model('Test', TestSchema);
    
    // Create a test document
    const testDoc = await Test.create({
      name: 'Test Veri ' + new Date().toISOString()
    });
    
    console.log('Test verisi oluşturuldu:', testDoc);
    
    // Find all test documents
    const allTests = await Test.find();
    console.log('Tüm test verileri:', allTests);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
    
  } catch (error) {
    console.error(`MongoDB bağlantı hatası: ${error.message}`);
    process.exit(1);
  }
};

// Run the function
connectDB();
