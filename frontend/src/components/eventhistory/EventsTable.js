import React from 'react';
import {
  RefreshCw,
  CheckCircle2,
  RotateCcw,
  Flame,
  Layers,
  AlertTriangle,
  Camera,
  MapPin,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import styles from './EventHistoryStyles';
import { ITEMS_PER_PAGE, formatTimeAgo, getFullImageUrl, parseEventDetections } from './EventHistoryHelpers';

const TypeBadges = ({ types }) => (
  <div style={styles.typeBadgesContainer}>
    {types.map((t) => {
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
            {t.label}
            {t.count > 1 ? ` (${t.count})` : ''}
          </span>
        </span>
      );
    })}
  </div>
);

const ConfidenceColumn = ({ types }) => (
  <div style={styles.confColumnList}>
    {types.map((t) => {
      const confPct = (t.maxConfidence * 100).toFixed(1);
      const isF = t.type === 'fire';
      return (
        <div key={t.type} style={styles.confCell}>
          <div style={styles.confRowHeader}>
            <span style={styles.confLabelType}>{t.label}</span>
            <span style={styles.confValueText}>{confPct}%</span>
          </div>
          <div style={styles.confBarBg}>
            <div
              style={{
                ...styles.confBarFill,
                width: `${Math.min(100, Math.max(0, confPct))}%`,
                backgroundColor: isF ? '#ef4444' : '#f59e0b',
              }}
            />
          </div>
        </div>
      );
    })}
  </div>
);

const EventTableRow = ({ item, index, camInfo, onSelectEvent }) => {
  const parsed = parseEventDetections(item);
  const fullImgUrl = getFullImageUrl(item.image_url);

  return (
    <tr style={styles.tableRow} className="interactive-row">
      {/* Column 1: Snapshot Thumbnail (Fixed Strict Size: 52px x 52px) */}
      <td style={{ ...styles.td, width: '68px', textAlign: 'center' }}>
        <div style={styles.thumbWrapper} onClick={() => onSelectEvent(item)} title="คลิกเพื่อดูภาพขยาย">
          {fullImgUrl ? (
            <img
              src={fullImgUrl}
              alt={item.event_id}
              style={styles.thumbImage}
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
              ...styles.thumbPlaceholder,
              display: fullImgUrl ? 'none' : 'flex',
            }}
          >
            {parsed.hasFire ? <Flame size={18} color="#ef4444" /> : <Layers size={18} color="#64748b" />}
          </div>
        </div>
      </td>

      {/* Column 2: Event ID & Sub-info */}
      <td style={styles.td}>
        <div style={styles.eventIdText}>{item.event_id || `EVT-#${index + 1}`}</div>
        <div style={styles.subTextMuted}>{formatTimeAgo(item.created_at)}</div>
      </td>

      {/* Column 3: Types Detected */}
      <td style={styles.td}>
        <TypeBadges types={parsed.types} />
      </td>

      {/* Column 4: Confidence Score for Each Detected Type */}
      <td style={styles.td}>
        <ConfidenceColumn types={parsed.types} />
      </td>

      {/* Column 5: Camera ID & Location */}
      <td style={styles.td}>
        <div style={styles.locationBlock}>
          <div style={styles.cameraName}>
            <Camera size={13} color="#64748b" />
            <span style={styles.camMonoId}>{item.camera_id}</span>
          </div>
          <div style={styles.camLocationText}>
            <MapPin size={12} color="#94a3b8" />
            <span>{camInfo ? `${camInfo.location} - ${camInfo.sub_location}` : 'ไม่ระบุสถานที่'}</span>
          </div>
        </div>
      </td>

      {/* Column 6: Timestamp */}
      <td style={styles.td}>
        <div style={styles.timeMain}>
          {item.created_at ? new Date(item.created_at).toLocaleTimeString() : '-'}
        </div>
        <div style={styles.subTextMuted}>
          {item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH') : '-'}
        </div>
      </td>

      {/* Column 7: Action Button */}
      <td style={{ ...styles.td, textAlign: 'center' }}>
        <button
          onClick={() => onSelectEvent(item)}
          style={styles.viewDetailsBtn}
          title="ดูรายละเอียดและภาพหลักฐาน"
        >
          <Eye size={14} />
          <span>ดูภาพ</span>
        </button>
      </td>
    </tr>
  );
};

const PaginationFooter = ({ filteredCount, currentPage, totalPages, onPageChange }) => (
  <div style={styles.paginationFooter}>
    <div style={styles.paginationInfo}>
      แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
      {Math.min(currentPage * ITEMS_PER_PAGE, filteredCount)} จากทั้งหมด {filteredCount} รายการ
    </div>

    <div style={styles.paginationControls}>
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        style={{
          ...styles.pageBtn,
          opacity: currentPage === 1 ? 0.4 : 1,
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
        }}
        title="หน้าก่อนหน้า"
      >
        <ChevronLeft size={16} />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
        .map((p, idx, arr) => {
          const prevP = arr[idx - 1];
          const showEllipsis = prevP && p - prevP > 1;

          return (
            <React.Fragment key={p}>
              {showEllipsis && <span style={styles.pageEllipsis}>...</span>}
              <button
                onClick={() => onPageChange(p)}
                style={{
                  ...styles.pageNumBtn,
                  ...(currentPage === p ? styles.pageNumBtnActive : {}),
                }}
              >
                {p}
              </button>
            </React.Fragment>
          );
        })}

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        style={{
          ...styles.pageBtn,
          opacity: currentPage === totalPages ? 0.4 : 1,
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
        }}
        title="หน้าถัดไป"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

const EventsTable = ({
  loading,
  filteredEvents,
  paginatedEvents,
  camerasMap,
  currentPage,
  totalPages,
  onPageChange,
  onSelectEvent,
  onResetFilters,
}) => {
  return (
    <div style={styles.tableCard}>
      {loading ? (
        <div style={styles.loadingArea}>
          <RefreshCw size={28} className="spin-icon" color="#2563eb" />
          <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>
            กำลังเชื่อมต่อและโหลดข้อมูลประวัติเหตุการณ์...
          </p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div style={styles.emptyArea}>
          <div style={styles.emptyIconCircle}>
            <CheckCircle2 size={36} color="#16a34a" />
          </div>
          <h3 style={styles.emptyTitle}>ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา</h3>
          <p style={styles.emptyDesc}>
            กรุณาปรับเปลี่ยนคำค้นหา หรือกดปุ่ม "ล้างตัวกรอง" เพื่อแสดงข้อมูลประวัติทั้งหมด
          </p>
          <button onClick={onResetFilters} style={styles.emptyResetBtn}>
            <RotateCcw size={14} />
            <span>ล้างตัวกรองทั้งหมด</span>
          </button>
        </div>
      ) : (
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={{ ...styles.th, width: '68px', textAlign: 'center' }}>ภาพ Snapshot</th>
                <th style={styles.th}>Event ID</th>
                <th style={styles.th}>ประเภทที่ตรวจพบ</th>
                <th style={styles.th}>ความมั่นใจ (AI)</th>
                <th style={styles.th}>กล้อง & ตำแหน่ง</th>
                <th style={styles.th}>วันและเวลาที่บันทึก</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>การกระทำ</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.map((item, index) => (
                <EventTableRow
                  key={item.event_id || index}
                  item={item}
                  index={index}
                  camInfo={camerasMap[item.camera_id]}
                  onSelectEvent={onSelectEvent}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredEvents.length > 0 && (
        <PaginationFooter
          filteredCount={filteredEvents.length}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default EventsTable;
