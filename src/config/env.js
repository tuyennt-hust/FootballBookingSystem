const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function readNumber(name, fallback) {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === '') {
    return fallback;
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    throw new Error(`${name} phai la mot so hop le`);
  }

  return value;
}

function readRequired(name, fallback = '') {
  const value = process.env[name] ?? fallback;

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Thieu bien moi truong bat buoc: ${name}`);
  }

  return value.trim();
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: readNumber('PORT', 3000),
  session: {
    secret: process.env.SESSION_SECRET || 'football-booking-development-secret-change-me',
    cookieName: process.env.SESSION_COOKIE_NAME || 'football.sid',
    maxAgeMillis: readNumber('SESSION_MAX_AGE_MS', 1000 * 60 * 60 * 8),
  },
  database: {
    host: readRequired('DB_HOST', 'localhost'),
    port: readNumber('DB_PORT', 5432),
    name: readRequired('DB_NAME', 'dat_san_bong'),
    user: readRequired('DB_USER', 'postgres'),
    password: process.env.DB_PASSWORD ?? '',
    maxConnections: readNumber('DB_POOL_MAX', 10),
    idleTimeoutMillis: readNumber('DB_IDLE_TIMEOUT_MS', 30000),
    connectionTimeoutMillis: readNumber('DB_CONNECTION_TIMEOUT_MS', 5000),
  },
};

if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error('PORT phai la so nguyen trong khoang 1-65535');
}

if (!Number.isInteger(config.session.maxAgeMillis) || config.session.maxAgeMillis < 60000) {
  throw new Error('SESSION_MAX_AGE_MS phai la so nguyen lon hon hoac bang 60000');
}

if (!Number.isInteger(config.database.port)
  || config.database.port < 1
  || config.database.port > 65535) {
  throw new Error('DB_PORT phai la so nguyen trong khoang 1-65535');
}


if (config.nodeEnv === 'production') {
  if (config.session.secret === 'football-booking-development-secret-change-me'
    || config.session.secret.length < 32) {
    throw new Error('SESSION_SECRET production phai co it nhat 32 ky tu va khong dung gia tri mac dinh');
  }

  if (!config.database.password) {
    throw new Error('DB_PASSWORD khong duoc de trong khi chay production');
  }
}

module.exports = Object.freeze(config);
