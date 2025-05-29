const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  console.error('Error handler çalıştı');
  console.error('Orijinal hata:', err);
  
  let error = { ...err };
  error.message = err.message;

  // Log the error stack
  console.error(err.stack);

  // MongoDB hatalı ID
  if (err.name === 'CastError') {
    const message = `Kaynak bulunamadı: ${err.value}`;
    console.error('CastError:', message);
    error = new ErrorResponse(message, 404);
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    // Extract the duplicate field
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field} değeri '${value}' zaten kullanılıyor`;
    console.error('Duplicate key error:', message);
    error = new ErrorResponse(message, 400);
  }

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    console.error('Validation error:', message);
    error = new ErrorResponse(message, 400);
  }

  // SyntaxError - JSON parsing
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON parse error:', err.message);
    error = new ErrorResponse('Geçersiz JSON formatı', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    console.error('JWT error:', err.message);
    error = new ErrorResponse('Geçersiz token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    console.error('Token expired error');
    error = new ErrorResponse('Token süresi doldu', 401);
  }

  // Final response
  const statusCode = error.statusCode || 500;
  const errorMessage = error.message || 'Sunucu hatası';
  
  console.error(`Hata yanıtı gönderiliyor: ${statusCode} - ${errorMessage}`);
  
  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    // Include stack trace in development mode
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
