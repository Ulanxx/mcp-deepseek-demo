export const config = {
  server: {
    port: process.env.PORT || 8083,
    cors: {
      origin: process.env.ALLOWED_ORIGINS || '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  heartbeat: {
    interval: parseInt(process.env.HEARTBEAT_INTERVAL || '30000')
  }
}; 