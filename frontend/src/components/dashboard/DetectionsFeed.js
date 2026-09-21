import React from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  RefreshCw,
  Camera,
  MapPin,
  AlertTriangle,
  Eye,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import styles from './DashboardStyles';
import { formatTimeAgo, parseEventDetections } from './DashboardHelpers';

const DetectionTypeBadges = ({ types }) => (
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

const DetectionRow = ({ item, index, camInfo, onViewEvent, isAdmin }) => {
  const parsed = parseEventDetections(item);

  return (
    <tr style={styles.tableRow} className="interactive-row">
      <td style={styles.td}>
        <div style={styles.eventIdText}>{item.event_id || `EVT-#${index + 1}`}</div>
        <div style={styles.subTextMuted}>{formatTimeAgo(item.created_at)}</div>
      </td>

      <td style={styles.td}>
        <DetectionTypeBadges types={parsed.types} />
      </td>

      {isAdmin && (
        <td style={styles.td}>
          <ConfidenceColumn types={parsed.types} />
        </td>
      )}

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

      <td style={styles.td}>
        <div style={styles.timeMain}>
          {item.created_at ? new Date(item.created_at).toLocaleTimeString() : '-'}
        </div>
        <div style={styles.subTextMuted}>
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
        </div>
      </td>

      <td style={{ ...styles.td, textAlign: 'center' }}>
        <button
          onClick={() => onViewEvent(item)}
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

const DetectionsFeed = ({
  loading,
  filteredDetections,
  recentDetections,
  camerasMap,
  filterType,
  onFilterChange,
  eventsWithFire,
  eventsWithSmoke,
  onViewEvent,
  isAdmin,
}) => {
  return (
    <div style={styles.mainCard} className="dash-card">
      {/* Card Header & Filter Tabs */}
      <div style={styles.cardHeaderArea}>
        <div style={styles.cardHeaderLeft}>
          <div style={styles.cardTitleWithIcon}>
            <Flame size={18} color="#dc2626" />
            <h3 style={styles.cardTitle}>เหตุการณ์ตรวจจับล่าสุด (Recent Detections)</h3>
          </div>
          <span style={styles.badgeLivePulse}>
            <span style={styles.liveDotSmall} className="live-dot-pulse" />
            Live Feed
          </span>
        </div>

        <div style={styles.filterGroup}>
          <button
            className="filter-btn"
            onClick={() => onFilterChange('all')}
            style={{
              ...styles.filterTab,
              ...(filterType === 'all' ? styles.filterTabActive : {}),
            }}
          >
            ทั้งหมด ({recentDetections.length})
          </button>
          <button
            className="filter-btn"
            onClick={() => onFilterChange('fire')}
            style={{
              ...styles.filterTab,
              ...(filterType === 'fire' ? styles.filterTabActiveFire : {}),
            }}
          >
            ไฟ ({eventsWithFire})
          </button>
          <button
            className="filter-btn"
            onClick={() => onFilterChange('smoke')}
            style={{
              ...styles.filterTab,
              ...(filterType === 'smoke' ? styles.filterTabActiveSmoke : {}),
            }}
          >
            ควัน ({eventsWithSmoke})
          </button>
        </div>
      </div>

      {/* Content Table */}
      {loading ? (
        <div style={styles.loadingArea}>
          <RefreshCw size={24} className="spin-icon" color="#2563eb" />
          <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>
            กำลังเชื่อมต่อและโหลดข้อมูลเหตุการณ์...
          </p>
        </div>
      ) : filteredDetections.length === 0 ? (
        <div style={styles.emptyArea}>
          <div style={styles.emptyIconCircle}>
            <CheckCircle2 size={32} color="#16a34a" />
          </div>
          <h4 style={styles.emptyTitle}>ไม่พบรายการตรวจจับ</h4>
          <p style={styles.emptyDesc}>
            {filterType === 'all'
              ? 'ระบบไม่พบเหตุการณ์เพลิงไหม้หรือควันในขณะนี้ ข้อมูลจะอัปเดตอัตโนมัติเมื่อ AI ตรวจพบ'
              : `ไม่พบรายการประเภท "${filterType.toUpperCase()}" ในประวัติล่าสุด`}
          </p>
        </div>
      ) : (
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={styles.th}>Event ID</th>
                <th style={styles.th}>ประเภทที่ตรวจพบ</th>
                {isAdmin && <th style={styles.th}>ความมั่นใจ (AI)</th>}
                <th style={styles.th}>กล้อง & ตำแหน่ง</th>
                <th style={styles.th}>เวลาที่บันทึก</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>การกระทำ</th>
              </tr>
            </thead>
            <tbody>
              {filteredDetections.slice(0, 6).map((item, index) => (
                <DetectionRow
                  key={item.event_id || index}
                  item={item}
                  index={index}
                  camInfo={camerasMap[item.camera_id]}
                  onViewEvent={onViewEvent}
                  isAdmin={isAdmin}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Card Footer Link */}
      <div style={styles.cardFooter}>
        <span style={styles.cardFooterNote}>
          แสดงเหตุการณ์ล่าสุด {Math.min(6, filteredDetections.length)} จากทั้งหมด {filteredDetections.length} รายการ
        </span>
        <Link to="/events" style={styles.footerLink}>
          <span>ดูประวัติเหตุการณ์ทั้งหมด</span>
          <ArrowUpRight size={15} />
        </Link>
      </div>
    </div>
  );
};

export default DetectionsFeed;