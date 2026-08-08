const app = require('./app');
const config = require('./config/env');
const db = require('./config/database');
const { version } = require('../package.json');

let server;
let isShuttingDown = false;

async function startServer() {
  try {
    const database = await db.testConnection();

    console.log('[DATABASE] Ket noi PostgreSQL thanh cong');
    console.log(`[DATABASE] Database: ${database.database_name}`);
    console.log(`[DATABASE] User: ${database.database_user}`);

    if (config.session.secret === 'football-booking-development-secret-change-me') {
      console.warn('[SESSION] Dang dung SESSION_SECRET mac dinh. Hay thay trong file .env.');
    }

    server = app.listen(config.port, () => {
      console.log(`[SERVER] FootballBookingSystem v${version}: http://localhost:${config.port}`);
      console.log(`[SERVER] Kiem tra he thong: http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    console.error('[STARTUP] Khong the khoi dong ung dung:', error.message);
    await db.close().catch(() => {});
    process.exit(1);
  }
}

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[SHUTDOWN] Nhan tin hieu ${signal}, dang dong ung dung...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await db.close();
  console.log('[SHUTDOWN] Da dong ket noi PostgreSQL');
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
