import React from 'react';
import { Layers, Flame, AlertTriangle, Clock } from 'lucide-react';
import styles from './EventHistoryStyles';

const SummaryStatsCards = ({ totalCount, fireCount, smokeCount, todayCount }) => {
  return (
    <div style={styles.statsGrid}>
      <div style={styles.statCard}>
        <div style={styles.statHeader}>
          <span style={styles.statLabel}>เหตุการณ์ทั้งหมด</span>
          <div style={{ ...styles.statIconBadge, backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <Layers size={18} />
          </div>
        </div>
        <div style={styles.statNumber}>{totalCount}</div>
        <div style={styles.statSub}>บันทึกในฐานข้อมูลทั้งหมด</div>
      </div>

      <div style={styles.statCard}>
        <div style={styles.statHeader}>
          <span style={styles.statLabel}>พบเปลวไฟ (Fire)</span>
          <div style={{ ...styles.statIconBadge, backgroundColor: '#fee2e2', color: '#dc2626' }}>
            <Flame size={18} />
          </div>
        </div>
        <div style={{ ...styles.statNumber, color: '#dc2626' }}>{fireCount}</div>
        <div style={styles.statSub}>เหตุการณ์ที่มีสัญญาณไฟไหม้</div>
      </div>

      <div style={styles.statCard}>
        <div style={styles.statHeader}>
          <span style={styles.statLabel}>พบกลุ่มควัน (Smoke)</span>
          <div style={{ ...styles.statIconBadge, backgroundColor: '#fef3c7', color: '#d97706' }}>
            <AlertTriangle size={18} />
          </div>
        </div>
        <div style={{ ...styles.statNumber, color: '#d97706' }}>{smokeCount}</div>
        <div style={styles.statSub}>เหตุการณ์ที่มีสัญญาณกลุ่มควัน</div>
      </div>

      <div style={styles.statCard}>
        <div style={styles.statHeader}>
          <span style={styles.statLabel}>เกิดขึ้นวันนี้</span>
          <div style={{ ...styles.statIconBadge, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <Clock size={18} />
          </div>
        </div>
        <div style={{ ...styles.statNumber, color: '#16a34a' }}>{todayCount}</div>
        <div style={styles.statSub}>เหตุการณ์ประจำวันปัจจุบัน</div>
      </div>
    </div>
  );
};

export default SummaryStatsCards;
