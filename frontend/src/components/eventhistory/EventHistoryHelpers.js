export const API_BASE_URL = 'http://localhost:8080/api';
export const BACKEND_BASE_URL = 'http://localhost:8080';
export const ITEMS_PER_PAGE = 10;

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

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

// Helper to parse all detection details from an event
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

// Builds and downloads a CSV export of the given events
export const exportEventsToCSV = (filteredEvents, camerasMap) => {
  if (filteredEvents.length === 0) {
    alert('ไม่มีข้อมูลให้ส่งออก');
    return;
  }

  const headers = [
    'Event ID',
    'วันที่และเวลา',
    'รหัสกล้อง',
    'สถานที่',
    'จุดย่อย',
    'ประเภทที่ตรวจพบ',
    'ความมั่นใจไฟ (%)',
    'ความมั่นใจควัน (%)',
    'URL ภาพ',
  ];

  const rows = filteredEvents.map((evt) => {
    const parsed = parseEventDetections(evt);
    const cam = camerasMap[evt.camera_id];
    const typesStr = parsed.types.map((t) => `${t.label}(${t.count})`).join('; ');
    const fireConf = parsed.hasFire ? (parsed.maxFireConfidence * 100).toFixed(1) : '-';
    const smokeConf = parsed.hasSmoke ? (parsed.maxSmokeConfidence * 100).toFixed(1) : '-';
    const dateStr = evt.created_at ? new Date(evt.created_at).toLocaleString('th-TH') : '-';
    const fullImg = getFullImageUrl(evt.image_url) || '';

    return [
      `"${evt.event_id || ''}"`,
      `"${dateStr}"`,
      `"${evt.camera_id || ''}"`,
      `"${cam?.location || ''}"`,
      `"${cam?.sub_location || ''}"`,
      `"${typesStr}"`,
      `"${fireConf}"`,
      `"${smokeConf}"`,
      `"${fullImg}"`,
    ].join(',');
  });

  // UTF-8 BOM for Excel Thai compatibility
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `event_history_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
