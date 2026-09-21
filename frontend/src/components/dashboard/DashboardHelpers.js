// Constants
export const API_BASE_URL = 'http://localhost:8080/api';
export const BACKEND_BASE_URL = 'http://localhost:8080';
export const POLL_INTERVAL_MS = 20000; // Fallback polling interval when SSE is active
export const ACTIVE_CAMERA_STATUS = 'active';

export const getSSEUrl = () => {
  const token = localStorage.getItem('token') || '';
  return `${API_BASE_URL}/events/stream?token=${encodeURIComponent(token)}`;
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const isCameraOnline = (cam) =>
  cam.is_active === true || cam.status === ACTIVE_CAMERA_STATUS;

export const isAuthError = (result) =>
  result.status === 'rejected' && result.reason?.response?.status === 401;

export const getFullImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BACKEND_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const formatTimeAgo = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'เมื่อสักครู่';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatClock = (date) => {
  if (!date) return '-';
  return date.toLocaleTimeString('th-TH', { hour12: false });
};

// Parses all detection types and confidence scores from an event
export const parseEventDetections = (event) => {
  if (!event) {
    return {
      details: [],
      hasFire: false,
      hasSmoke: false,
      hasBoth: false,
      types: [],
      highestConf: 0,
      totalCount: 0,
    };
  }

  let details = [];
  if (Array.isArray(event.details) && event.details.length > 0) {
    details = event.details;
  } else if (event.detection_type) {
    details = [
      {
        detection_type: event.detection_type,
        confidence: typeof event.confidence === 'number' ? event.confidence : 0,
      },
    ];
  }

  let hasFire = false;
  let hasSmoke = false;
  let maxFireConfidence = 0;
  let maxSmokeConfidence = 0;
  let highestConf = 0;
  const typesMap = {};

  details.forEach((d) => {
    const rawType = (d.detection_type || '').toLowerCase().trim();
    const conf = typeof d.confidence === 'number' ? d.confidence : 0;
    if (conf > highestConf) highestConf = conf;

    if (rawType.includes('fire')) {
      hasFire = true;
      if (conf > maxFireConfidence) maxFireConfidence = conf;
      if (!typesMap['fire']) {
        typesMap['fire'] = { type: 'fire', label: 'FIRE', maxConfidence: conf, count: 0 };
      }
      typesMap['fire'].count += 1;
      typesMap['fire'].maxConfidence = Math.max(typesMap['fire'].maxConfidence, conf);
    } else if (rawType.includes('smoke')) {
      hasSmoke = true;
      if (conf > maxSmokeConfidence) maxSmokeConfidence = conf;
      if (!typesMap['smoke']) {
        typesMap['smoke'] = { type: 'smoke', label: 'SMOKE', maxConfidence: conf, count: 0 };
      }
      typesMap['smoke'].count += 1;
      typesMap['smoke'].maxConfidence = Math.max(typesMap['smoke'].maxConfidence, conf);
    } else if (rawType) {
      if (!typesMap[rawType]) {
        typesMap[rawType] = { type: rawType, label: rawType.toUpperCase(), maxConfidence: conf, count: 0 };
      }
      typesMap[rawType].count += 1;
      typesMap[rawType].maxConfidence = Math.max(typesMap[rawType].maxConfidence, conf);
    }
  });

  const types = Object.values(typesMap);
  if (types.length === 0) {
    types.push({ type: 'unknown', label: 'UNKNOWN', maxConfidence: 0, count: 0 });
  }

  return {
    details,
    hasFire,
    hasSmoke,
    hasBoth: hasFire && hasSmoke,
    maxFireConfidence,
    maxSmokeConfidence,
    highestConf,
    types,
    totalCount: details.length,
  };
};
