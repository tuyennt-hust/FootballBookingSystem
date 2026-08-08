const PITCH_TYPES = ['San 5 nguoi', 'San 7 nguoi', 'San 11 nguoi'];
const PITCH_STATUSES = ['Hoat dong', 'Bao tri', 'Ngung hoat dong'];

const DEFAULT_IMAGES = {
  'San 5 nguoi': '/images/pitch-5.svg',
  'San 7 nguoi': '/images/pitch-7.svg',
  'San 11 nguoi': '/images/pitch-11.svg',
};

const STATUS_META = {
  'Hoat dong': { label: 'Hoạt động', className: 'status-active' },
  'Bao tri': { label: 'Bảo trì', className: 'status-maintenance' },
  'Ngung hoat dong': { label: 'Ngừng hoạt động', className: 'status-inactive' },
};

function getPitchImage(pitchType, storedImageUrl = '') {
  const imageUrl = String(storedImageUrl || '').trim();
  if (imageUrl.startsWith('/uploads/pitches/')) return imageUrl;
  return DEFAULT_IMAGES[pitchType] || '/images/pitch-default.svg';
}

function pitchStatusMeta(status) {
  return STATUS_META[status] || { label: status || 'Không xác định', className: 'status-inactive' };
}

module.exports = {
  getPitchImage,
  pitchStatusMeta,
  PITCH_STATUSES,
  PITCH_TYPES,
};
