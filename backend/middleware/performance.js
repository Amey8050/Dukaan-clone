// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Override res.end to measure performance
  const originalEnd = res.end.bind(res);
  res.end = function (chunk, encoding) {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    const memoryUsed = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024; // MB

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`⚠️  Slow Request: ${req.method} ${req.originalUrl} took ${duration}ms (${memoryUsed.toFixed(2)}MB)`);
    }

    // Add performance headers
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('X-Memory-Used', `${memoryUsed.toFixed(2)}MB`);

    return originalEnd(chunk, encoding);
  };

  next();
};

module.exports = performanceMonitor;

