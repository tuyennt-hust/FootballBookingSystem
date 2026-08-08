function wantsHtml(req) {
  return req.accepts(['html', 'json']) === 'html' && !req.originalUrl.startsWith('/api');
}

function notFoundHandler(req, res) {
  const status = 404;
  const message = 'Không tìm thấy tài nguyên.';

  if (wantsHtml(req)) {
    return res.status(status).render('error/404', {
      status,
      message,
      title: 'Không tìm thấy trang',
      pageDescription: message,
    });
  }

  return res.status(status).json({ success: false, message });
}

function errorHandler(error, req, res, next) {
  void next;

  let status = Number(error.status) || 500;
  let message = error.message || 'Lỗi máy chủ nội bộ.';

  if (error.name === 'MulterError') {
    status = 422;
    message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Ảnh sân không được vượt quá 5 MB.'
      : 'Không thể xử lý ảnh tải lên. Vui lòng chọn ảnh khác.';
  }

  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, error);

  if (wantsHtml(req)) {
    let view = 'error/500';
    let title = 'Lỗi hệ thống';

    if (status === 403) {
      view = 'error/403';
      title = 'Không có quyền truy cập';
    } else if (status === 404) {
      view = 'error/404';
      title = 'Không tìm thấy trang';
    } else if (status === 400 || status === 409 || status === 422) {
      view = 'error/400';
      title = 'Yêu cầu chưa hợp lệ';
    }

    return res.status(status).render(view, {
      status,
      message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : null,
      title,
      pageDescription: message,
    });
  }

  return res.status(status).json({
    success: false,
    message,
    code: error.code,
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
}

module.exports = { notFoundHandler, errorHandler };
