process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-32-bytes-minimum!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-32-bytes-minimum!!';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
