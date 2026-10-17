export const toDate = (dateInput) => {
  if (!dateInput) return null;
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return isNaN(d.getTime()) ? null : d;
};

export const formatThaiTime = (dateInput, includeSeconds = true) => {
  const d = toDate(dateInput);
  if (!d) return '-';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  if (includeSeconds) {
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds} น.`;
  }
  return `${hours}:${minutes} น.`;
};

export const formatThaiDate = (dateInput, { format = 'short' } = {}) => {
  const d = toDate(dateInput);
  if (!d) return '-';

  if (format === 'numeric') {
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: format === 'long' ? 'long' : 'short',
    day: 'numeric',
  });
};

export const formatThaiDateTime = (
  dateInput,
  { includeSeconds = true, fullMonth = false, withPrefix = true } = {}
) => {
  const d = toDate(dateInput);
  if (!d) return '-';

  const datePart = formatThaiDate(d, { format: fullMonth ? 'long' : 'short' });
  const timePart = formatThaiTime(d, includeSeconds);
  const connector = withPrefix ? ' เวลา ' : ' ';
  return `${datePart}${connector}${timePart}`;
};

export const formatThaiTimeAgo = (dateInput) => {
  const d = toDate(dateInput);
  if (!d) return '-';

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 0) return 'เมื่อสักครู่';
  if (diffSec < 60) return 'เมื่อสักครู่';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

  return `${formatThaiDate(d, { format: 'short' })} ${formatThaiTime(d, false)}`;
};
