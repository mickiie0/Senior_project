export const API_BASE_URL = 'http://localhost:8080/api';
export const STATIC_BASE_URL = 'http://localhost:8080';
export const ITEMS_PER_PAGE = 20;

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatTimeAgo = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);

  if (diffSec < 60) return 'เมื่อสักครู่';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ชม.ที่แล้ว`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} วันที่แล้ว`;
  return formatDateTime(dateString);
};

export const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${STATIC_BASE_URL}${cleanPath}`;
};

export const exportSnapshotsToCSV = (snapshots, camerasMap) => {
  if (!snapshots || snapshots.length === 0) {
    alert('ไม่มีข้อมูล Snapshot ให้ส่งออก');
    return;
  }

  const headers = [
    'Snapshot ID',
    'วันที่และเวลาบันทึก',
    'รหัสกล้อง',
    'สถานที่',
    'จุดติดตั้ง',
    'ขนาดไฟล์ (Bytes)',
    'ขนาดไฟล์',
    'URL รูปภาพ',
  ];

  const rows = snapshots.map((snp) => {
    const cam = camerasMap[snp.camera_id] || {};
    const dateStr = formatDateTime(snp.captured_at || snp.created_at);
    const sizeReadable = formatFileSize(snp.file_size);
    const fullImg = getFullImageUrl(snp.file_path);

    return [
      `"${snp.id || ''}"`,
      `"${dateStr}"`,
      `"${snp.camera_id || ''}"`,
      `"${cam.location || ''}"`,
      `"${cam.sub_location || ''}"`,
      `"${snp.file_size || 0}"`,
      `"${sizeReadable}"`,
      `"${fullImg}"`,
    ].join(',');
  });

  // UTF-8 BOM for Microsoft Excel Thai compatibility
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `snapshots_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
