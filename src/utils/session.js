function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function safeRedirectPath(rawPath, fallback = '/') {
  if (typeof rawPath !== 'string') return fallback;

  const path = rawPath.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    return fallback;
  }

  return path;
}

module.exports = {
  destroySession,
  regenerateSession,
  safeRedirectPath,
  saveSession,
  setFlash,
};
