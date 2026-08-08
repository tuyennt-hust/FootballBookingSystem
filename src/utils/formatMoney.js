module.exports = function formatMoney(value, locale = 'vi-VN', currency = 'VND') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(value) || 0);
};
