import { formatThaiDateTime, formatThaiTimeAgo } from '../../utils/thaiDate';

export const API_URL = 'http://localhost:8080/api';

export const hasFireOrSmoke = (event) => {
  if (!event) return false;
  if (Array.isArray(event.details)) {
    return event.details.some(
      (d) =>
        (d.detection_type || '').toLowerCase().includes('fire') ||
        (d.detection_type || '').toLowerCase().includes('smoke')
    );
  }
  return (
    (event.detection_type || '').toLowerCase().includes('fire') ||
    (event.detection_type || '').toLowerCase().includes('smoke')
  );
};

export const formatTimeAgoMini = (dateString) => formatThaiTimeAgo(dateString);

export const formatDateTimeThai = (dateString) =>
  formatThaiDateTime(dateString, { includeSeconds: true });

export const getCachedUser = () => {
  try {
    const cached = localStorage.getItem('user_info');
    if (cached) return JSON.parse(cached);
  } catch (_) {}
  return null;
};

// Read-notification IDs persisted in localStorage
export const getStoredReadIds = () => {
  try {
    const stored = localStorage.getItem('read_notif_ids');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch (_) {
    return new Set();
  }
};
