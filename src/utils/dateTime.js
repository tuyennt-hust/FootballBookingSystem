function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatDateInput(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseDateInput(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function addDays(date, amount) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + amount);
  return result;
}

function getDateWindow(now = new Date(), daysAhead = 30, nextDayCutoffMinutes = null) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const maxDate = addDays(today, daysAhead);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const shouldUseNextDay = Number.isFinite(nextDayCutoffMinutes)
    && currentMinutes >= nextDayCutoffMinutes;
  const defaultDate = shouldUseNextDay ? addDays(today, 1) : today;

  return {
    minDate: formatDateInput(today),
    maxDate: formatDateInput(maxDate),
    defaultDate: formatDateInput(defaultDate),
  };
}

function formatDateLabel(value, locale = 'vi-VN') {
  const date = typeof value === 'string' ? parseDateInput(value) : value;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function timeToMinutes(value) {
  if (typeof value !== 'string') return Number.NaN;
  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) return Number.NaN;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return Number.NaN;
  return hour * 60 + minute;
}

module.exports = {
  addDays,
  formatDateInput,
  formatDateLabel,
  getDateWindow,
  parseDateInput,
  timeToMinutes,
};
