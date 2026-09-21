import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Camera, AlertTriangle, X, ArrowUpRight } from 'lucide-react';
import styles from './DashboardStyles';
import { getFullImageUrl, parseEventDetections } from './DashboardHelpers';

const EventDetailModal = ({ selectedEvent, camerasMap, onClose, isAdmin }) => {
  if (!selectedEvent) return null;

  const selectedParsed = parseEventDetections(selectedEvent);
  const camInfo = camerasMap[selectedEvent.camera_id];

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <div style={styles.modalHeaderTitleRow}>
            <Flame size={20} color="#dc2626" />
            <div>
              <h3 style={styles.modalTitle}>รายละเอียดเหตุการณ์ {selectedEvent.event_id}</h3>
              <div style={styles.modalSubtitle}>
                บันทึกเมื่อ:{' '}
                {selectedEvent.created_at
                  ? new Date(selectedEvent.created_at).toLocaleString('th-TH')
                  : '-'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={styles.modalCloseBtn} title="ปิดหน้าต่าง">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={styles.modalBody}>
          {/* Snapshot Image Container */}
          <div style={styles.modalImageContainer}>
            {selectedEvent.image_url ? (
              <img
                src={getFullImageUrl(selectedEvent.image_url)}
                alt={`Snapshot ${selectedEvent.event_id}`}
                style={styles.modalImage}
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div
              style={{
                ...styles.modalImageFallback,
                display: selectedEvent.image_url ? 'none' : 'flex',
              }}
            >
              <Camera size={40} color="#94a3b8" />
              <p style={{ marginTop: '8px', color: '#64748b', fontSize: '14px' }}>
                ไม่มีภาพ Snapshot บันทึกไว้สำหรับเหตุการณ์นี้
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div style={styles.modalDetailsGrid}>
            <div style={styles.modalDetailCard}>
              <span style={styles.modalDetailLabel}>ประเภทที่ตรวจจับได้</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {selectedParsed.types.map((t) => {
                  const isF = t.type === 'fire';
                  const isS = t.type === 'smoke';
                  return (
                    <span
                      key={t.type}
                      style={{
                        ...styles.typeBadge,
                        backgroundColor: isF ? '#fee2e2' : isS ? '#fef3c7' : '#f1f5f9',
                        color: isF ? '#b91c1c' : isS ? '#b45309' : '#475569',
                        border: `1px solid ${isF ? '#fecaca' : isS ? '#fde68a' : '#e2e8f0'}`,
                      }}
                    >
                      {isF ? <Flame size={12} /> : isS ? <AlertTriangle size={12} /> : null}
                      <span>
                        {t.label} {t.count > 1 ? `(${t.count})` : ''}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>

            {isAdmin && (
              <div style={styles.modalDetailCard}>
                <span style={styles.modalDetailLabel}>ความมั่นใจสูงสุดของ AI</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  {selectedParsed.types.map((t) => (
                    <div
                      key={t.type}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{t.label}:</span>
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          color: t.type === 'fire' ? '#dc2626' : '#d97706',
                        }}
                      >
                        {(t.maxConfidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.modalDetailCard}>
              <span style={styles.modalDetailLabel}>กล้องวงจรปิด</span>
              <div style={styles.modalDetailValueMono}>{selectedEvent.camera_id || '-'}</div>
              <div style={styles.modalDetailSub}>IP: {camInfo?.ip_address || '-'}</div>
            </div>

            <div style={styles.modalDetailCard}>
              <span style={styles.modalDetailLabel}>ตำแหน่งที่เกิดเหตุ</span>
              <div style={styles.modalDetailValue}>{camInfo?.location || 'ไม่ระบุอาคาร'}</div>
              <div style={styles.modalDetailSub}>{camInfo?.sub_location || '-'}</div>
            </div>
          </div>

          {/* Bounding Box Detail List */}
          {selectedParsed.details && selectedParsed.details.length > 0 && (
            <div style={styles.bboxSection}>
              <span style={styles.bboxSectionTitle}>
                พิกัดตรวจจับ Bounding Boxes ทั้งหมด ({selectedParsed.details.length} วัตถุ)
              </span>
              <div style={styles.bboxGridScroll}>
                {selectedParsed.details.map((box, bIdx) => {
                  const isF = (box.detection_type || '').toLowerCase().includes('fire');
                  return (
                    <div key={box.id || bIdx} style={styles.bboxItem}>
                      <div style={styles.bboxItemTop}>
                        <span style={{ fontWeight: '600', color: isF ? '#b91c1c' : '#b45309' }}>
                          #{bIdx + 1} {box.detection_type?.toUpperCase()}
                        </span>
                        <span style={{ color: '#059669', fontWeight: '700' }}>
                          {isAdmin
                            ? typeof box.confidence === 'number'
                              ? `${(box.confidence * 100).toFixed(1)}%`
                              : '-'
                            : ''}
                        </span>
                      </div>
                      <div style={styles.bboxCoords}>
                        Center: ({box.box_center_x}, {box.box_center_y}) | Size: {box.box_width}x{box.box_height}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={styles.modalFooter}>
          <Link to="/events" style={styles.modalFullHistoryBtn} onClick={onClose}>
            <span>เปิดดูในหน้ารายงานประวัติ</span>
            <ArrowUpRight size={15} />
          </Link>
          <button onClick={onClose} style={styles.modalDismissBtn}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;