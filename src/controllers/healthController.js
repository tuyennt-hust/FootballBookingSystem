const db = require('../config/database');
const config = require('../config/env');
const { version } = require('../../package.json');

async function getHealth(req, res, next) {
  try {
    const database = await db.testConnection();

    return res.status(200).json({
      success: true,
      message: 'He thong dang hoat dong',
      data: {
        application: {
          version,
          environment: config.nodeEnv,
          uptimeSeconds: Math.floor(process.uptime()),
        },
        database: {
          connected: true,
          name: database.database_name,
          user: database.database_user,
          serverTime: database.server_time,
        },
      },
    });
  } catch (error) {
    error.status = 503;
    error.message = 'Khong the ket noi den PostgreSQL';
    return next(error);
  }
}

module.exports = { getHealth };
