function success(res, data = null, message = 'Thanh cong', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function failure(res, message = 'That bai', status = 400, details = null) {
  return res.status(status).json({ success: false, message, details });
}

module.exports = { success, failure };
