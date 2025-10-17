export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  bcrypt: {
    saltRounds: 12,
  },
  session: {
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds
  },
};