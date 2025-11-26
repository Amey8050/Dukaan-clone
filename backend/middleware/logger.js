// Request logging middleware
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`[${timestamp}] ${method} ${url} - ${ip}`);
  
  // Log request body for POST/PUT requests (excluding sensitive data)
  if ((method === 'POST' || method === 'PUT') && req.body) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.refresh_token) sanitizedBody.refresh_token = '***';
    console.log('Request body:', sanitizedBody);
  }
  
  // Log response status
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`[${timestamp}] ${method} ${url} - Status: ${res.statusCode}`);
    if (res.statusCode >= 400) {
      console.log('Error response:', data);
    }
    return originalSend.call(this, data);
  };
  
  next();
};

module.exports = logger;

