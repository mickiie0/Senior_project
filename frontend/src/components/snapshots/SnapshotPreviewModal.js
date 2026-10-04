import React from 'react';
import { X, Download, Camera, MapPin, Calendar, HardDrive } from 'lucide-react';
import styles from './SnapshotStyles';
import { formatDateTime, formatFileSize, getFullImageUrl } from './SnapshotHelpers';

const SnapshotPreviewModal = ({ snapshot, camerasMap, onClose }) => {
  if (!snapshot) return null;

  const cam = camerasMap[snapshot.camera_id] || {};
  const fullImgUrl = getFullImageUrl(snapshot.file_path);

  const handleDownload = () => {
    if (!fullImgUrl) return;
    const a = document.createElement('a');
    a.href = fullImgUrl;
    a.download = `${snapshot.id || 'snapshot'}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <div>
            <h3 style={styles.modalTitle}>รายละเอียดภาพถ่าย Snapshot</h3>
            <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
              {snapshot.id}
            </span>
          </div>
          <button onClick={onClose} style={styles.modalCloseBtn} title="ปิดหน้าต่าง">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={styles.modalBody}>
          {/* Large Image Preview */}
          <div style={styles.modalImgWrapper}>
            {fullImgUrl ? (
              <img
                src={fullImgUrl}
                alt={snapshot.id}
                style={styles.modalImg}
              />
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>ไม่มีรูปภาพ</div>
            )}
          </div>

          {/* Metadata Grid */}
          <div style={styles.modalInfoGrid}>
            <div style={styles.modalInfoItem}>
              <span style={styles.modalInfoLabel}>
                <Camera size={12} style={{ display: 'inline', marginRight: '4px' }} />
                รหัสกล้อง
              </span>
              <span style={styles.modalInfoValue}>{snapshot.camera_id}</span>
            </div>

            <div style={styles.modalInfoItem}>
              <span style={styles.modalInfoLabel}>
                <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                สถานที่ติดตั้ง
              </span>
              <span style={styles.modalInfoValue}>
                {cam.location ? `${cam.location} (${cam.sub_location || '-'})` : '-'}
              </span>
            </div>

            <div style={styles.modalInfoItem}>
              <span style={styles.modalInfoLabel}>
                <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                เวลาที่บันทึก
              </span>
              <span style={styles.modalInfoValue}>
                {formatDateTime(snapshot.captured_at || snapshot.created_at)}
              </span>
            </div>

            <div style={styles.modalInfoItem}>
              <span style={styles.modalInfoLabel}>
                <HardDrive size={12} style={{ display: 'inline', marginRight: '4px' }} />
                ขนาดไฟล์
              </span>
              <span style={styles.modalInfoValue}>
                {formatFileSize(snapshot.file_size)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={styles.modalFooter}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            ปิด
          </button>

          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
            }}
          >
            <Download size={15} />
            <span>ดาวน์โหลดภาพต้นฉบับ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SnapshotPreviewModal;
