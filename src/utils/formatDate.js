module.exports = function formatDate(value, locale = 'vi-VN') {
  if (!value) return '';
  return new Intl.DateTimeFormat(locale).format(new Date(value));
};
