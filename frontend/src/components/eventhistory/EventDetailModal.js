import React, { useState, useCallback } from 'react';
import { Flame, Camera, AlertTriangle, X, ExternalLink } from 'lucide-react';
import styles from './EventHistoryStyles';
import { getFullImageUrl, parseEventDetections, formatThaiDateTime } from './EventHistoryHelpers';

const BoundingBoxOverlay = ({ details, isAdmin }) => {
  const [imgMeta, setImgMeta] = useState(null);
  const [hasError, setHasError] = useState(false);
  const imgRef = React.useRef(null);

  const updateScale = useCallback(() => {
    if (imgRef.current && imgRef.current.naturalWidth) {
      const scale = imgRef.current.clientWidth / imgRef.current.naturalWidth;
      setImgMeta({ scale });
    }
  }, []);

  const handleImgLoad = useCallback(() => {
    updateScale();
  }, [updateScale]);

  React.useEffect(() => {
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  const handleImgError = useCallback(() => {
    setHasError(true);
  }, []);

  const fullImgUrl = details.__imgUrl;
  const boxes = details.__boxes || [];

  if (hasError || !fullImgUrl) {
    return (
      <div style={styles.modalImageFallback}>
        <Camera size={40} color="#94a3b8" />
        <p style={{ marginTop: '8px', color: '#64748b', fontSize: '14px' }}>
          ไม่มีภาพ Snapshot บันทึกไว้สำหรับเหตุการณ์นี้
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <img
        ref={imgRef}
        src={fullImgUrl}
        alt="snapshot"
        style={styles.modalImage}
        onLoad={handleImgLoad}
        onError={handleImgError}
      />

      {imgMeta &&
        boxes.map((box, idx) => {
          const { scale } = imgMeta;
          const isF = (box.detection_type || '').toLowerCase().includes('fire');

          const left = (box.box_center_x - box.box_width / 2) * scale;
          const top = (box.box_center_y - box.box_height / 2) * scale;
          const width = box.box_width * scale;
          const height = box.box_height * scale;

          const color = isF ? '#ef4444' : '#f59e0b';

          return (
            <div
              key={box.id || idx}
              style={{
                position: 'absolute',
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
                border: `2px solid ${color}`,
                borderRadius: '3px',
                pointerEvents: 'none',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '-1px',
                  backgroundColor: color,
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '1px 5px',
                  borderRadius: '3px 3px 3px 0',
                  whiteSpace: 'nowrap',
                  lineHeight: '16px',
                }}
              >
                #{idx + 1} {box.detection_type?.toUpperCase()}
              </div>
            </div>
          );
        })}
    </div>
  );
};

const EventDetailModal = ({ selectedEvent, camerasMap, onClose, isAdmin }) => {
  if (!selectedEvent) return null;

  const selectedParsed = parseEventDetections(selectedEvent);
  const fullImgUrl = getFullImageUrl(selectedEvent.image_url);
  const camInfo = camerasMap[selectedEvent.camera_id];

  const overlayDetails = {
    __imgUrl: fullImgUrl,
    __boxes: selectedParsed.details || [],
  };

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalHeaderTitleRow}>
            <Flame size={20} color="#dc2626" />
            <div>
              <h3 style={styles.modalTitle}>รายละเอียดเหตุการณ์ {selectedEvent.event_id}</h3>
              <div style={styles.modalSubtitle}>
                บันทึกเมื่อ:{' '}
                {formatThaiDateTime(selectedEvent.created_at)}
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
                <BoundingBoxOverlay details={overlayDetails} isAdmin={isAdmin} />
              ) : (
                <div style={styles.modalImageFallback}>
                  <Camera size={40} color="#94a3b8" />
                  <p style={{ marginTop: '8px', color: '#64748b', fontSize: '14px' }}>
                    ไม่มีภาพ Snapshot บันทึกไว้สำหรับเหตุการณ์นี้
                  </p>
                </div>
              )}
            </div>
          </div>

          <div style={styles.modalRightCol}>
            <div style={styles.modalDetailsGrid}>
              <div
                style={{
                  ...styles.modalDetailCard,
                  gridColumn: isAdmin ? 'auto' : 'span 2',
                }}
              >
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

            {isAdmin && selectedParsed.details && selectedParsed.details.length > 0 && (
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
                            {typeof box.confidence === 'number'
                              ? `${(box.confidence * 100).toFixed(1)}%`
                              : '-'}
                          </span>
                        </div>
                        <div style={styles.bboxCoordsGrid}>
                          <div style={styles.bboxCoordItem}>
                            <span style={styles.bboxCoordKey}>box_center_x:</span>
                            <span style={styles.bboxCoordVal}>{box.box_center_x ?? '-'}</span>
                          </div>
                          <div style={styles.bboxCoordItem}>
                            <span style={styles.bboxCoordKey}>box_center_y:</span>
                            <span style={styles.bboxCoordVal}>{box.box_center_y ?? '-'}</span>
                          </div>
                          <div style={styles.bboxCoordItem}>
                            <span style={styles.bboxCoordKey}>box_width:</span>
                            <span style={styles.bboxCoordVal}>{box.box_width ?? '-'}</span>
                          </div>
                          <div style={styles.bboxCoordItem}>
                            <span style={styles.bboxCoordKey}>box_height:</span>
                            <span style={styles.bboxCoordVal}>{box.box_height ?? '-'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={styles.modalFooter}>
          {fullImgUrl ? (
            <a href={fullImgUrl} target="_blank" rel="noopener noreferrer" style={styles.openTabLink}>
              <ExternalLink size={14} />
              <span>เปิดภาพเต็มในแท็บใหม่</span>
            </a>
          ) : (
            <div />
          )}
          <button onClick={onClose} style={styles.modalDismissBtn}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;