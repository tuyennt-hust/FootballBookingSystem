const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const apiRoutes = require('./routes');
const webRoutes = require('./routes/webRoutes');
const config = require('./config/env');
const db = require('./config/database');
const formatMoney = require('./utils/formatMoney');
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware');
const csrfProtection = require('./middlewares/csrfMiddleware');
const securityHeaders = require('./middlewares/securityMiddleware');

const app = express();
app.disable('x-powered-by');
const PgSessionStore = connectPgSimple(session);

if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

app.set('view engine', 'ejs');
app.set('views', path.resolve(process.cwd(), 'views'));
app.set('layout', 'layouts/main');
app.set('sessionCookieName', config.session.cookieName);

app.use(expressLayouts);
app.use(securityHeaders);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(express.static(path.resolve(process.cwd(), 'public')));

app.use(session({
  name: config.session.cookieName,
  secret: config.session.secret,
  store: new PgSessionStore({
    pool: db.pool,
    tableName: 'web_session',
    createTableIfMissing: true,
  }),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: config.session.maxAgeMillis,
  },
}));

app.use(csrfProtection);

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.formatMoney = formatMoney;
  res.locals.currentYear = new Date().getFullYear();
  res.locals.title = 'Football Booking System';
  res.locals.pageDescription = 'Hệ thống quản lý và đặt sân bóng trực tuyến.';
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;

  if (req.session.flash) {
    delete req.session.flash;
  }

  next();
});

app.use('/', webRoutes);
app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
