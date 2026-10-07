import React from 'react';
import {
  X,
  Download,
  Camera,
  ExternalLink,
  Info,
} from 'lucide-react';
import styles from './SnapshotStyles';
import {
  formatDateTime,
  formatTimeAgo,
  formatFileSize,
  getFullImageUrl,
} from './SnapshotHelpers';

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
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalHeaderTitleRow}>
            <Camera size={20} color="#2563eb" />
            <div>
              <h3 style={styles.modalTitle}>
                รายละเอียดภาพถ่าย {snapshot.id}
              </h3>
              <div style={styles.modalSubtitle}>
                บันทึกเมื่อ: {formatDateTime(snapshot.captured_at || snapshot.created_at)}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={styles.modalCloseBtn} title="ปิดหน้าต่าง">
            <X size={18} />
          </button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.modalLeftCol}>
            <div style={styles.modalImageContainer}>
              {fullImgUrl ? (
                <img
                  src={fullImgUrl}
                  alt={snapshot.id}
                  style={styles.modalImage}
                />
              ) : (
                <div style={styles.modalImageFallback}>
                  <Camera size={40} color="#94a3b8" />
                  <p style={{ marginTop: '8px', color: '#64748b', fontSize: '14px' }}>
                    ไม่มีภาพ Snapshot บันทึกไว้สำหรับรายการนี้
                  </p>
                </div>
              )}
            </div>
          </div>

          <div style={styles.modalRightCol}>
            <div style={styles.modalDetailsGrid}>
              <div style={styles.modalDetailCard}>
                <span style={styles.modalDetailLabel}>กล้องวงจรปิด</span>
                <div style={styles.modalDetailValueMono}>
                  {snapshot.camera_id || '-'}
                </div>
                <div style={styles.modalDetailSub}>
                  IP: {cam.ip_address || '-'}
                </div>
              </div>

              <div style={styles.modalDetailCard}>
                <span style={styles.modalDetailLabel}>ตำแหน่งที่ติดตั้ง</span>
                <div style={styles.modalDetailValue}>
                  {cam.location || 'ไม่ระบุอาคาร'}
                </div>
                <div style={styles.modalDetailSub}>
                  {cam.sub_location || '-'}
                </div>
              </div>

              <div style={styles.modalDetailCard}>
                <span style={styles.modalDetailLabel}>วันและเวลาที่บันทึก</span>
                <div style={styles.modalDetailValue}>
                  {formatDateTime(snapshot.captured_at || snapshot.created_at)}
                </div>
                <div style={styles.modalDetailSub}>
                  {formatTimeAgo(snapshot.captured_at || snapshot.created_at)}
                </div>
              </div>

              <div style={styles.modalDetailCard}>
                <span style={styles.modalDetailLabel}>ขนาดไฟล์</span>
                <div style={styles.modalDetailValue}>
                  {formatFileSize(snapshot.file_size)}
                </div>
                <div style={styles.modalDetailSub}>
                  {Number(snapshot.file_size || 0).toLocaleString()} Bytes
                </div>
              </div>
            </div>

            <div style={styles.bboxSection}>
              <span style={styles.bboxSectionTitle}>
                ข้อมูลการบันทึกภาพตัวอย่าง (Dataset Information)
              </span>
              <div style={styles.snapshotNoticeCard}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Info size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
                    ภาพนี้จัดเก็บอัตโนมัติทุก 10 นาทีในขณะที่สถานการณ์ปกติ (Negative Sample) เพื่อใช้เป็นชุดข้อมูลสำหรับตรวจสอบมุมมองและ Retrain พัฒนาโมเดล AI ให้มีความแม่นยำยิ่งขึ้น
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.modalFooter}>
          {fullImgUrl ? (
            <a
              href={fullImgUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.openTabLink}
            >
              <ExternalLink size={14} />
              <span>เปิดภาพเต็มในแท็บใหม่</span>
            </a>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {fullImgUrl && (
              <button
                onClick={handleDownload}
                style={styles.modalDownloadBtn}
                title="ดาวน์โหลดภาพต้นฉบับ"
              >
                <Download size={15} />
                <span>ดาวน์โหลดภาพ</span>
              </button>
            )}

            <button
              onClick={onClose}
              style={styles.modalDismissBtn}
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnapshotPreviewModal;
