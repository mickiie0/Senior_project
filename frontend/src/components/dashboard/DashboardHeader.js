import React from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import styles from './DashboardStyles';
import { formatClock } from './DashboardHelpers';

const DashboardHeader = ({ lastUpdated, isRefreshing, onRefresh }) => {
  return (
    <div style={styles.headerBar}>
      <div>
        <div style={styles.headerTitleRow}>
          <h1 style={styles.headerTitle}>แดชบอร์ดภาพรวมระบบ</h1>
          <div style={styles.livePill}>
            <span style={styles.liveDot} className="live-dot-pulse" />
            <span style={styles.liveText}>ระบบเฝ้าระวังแบบ Real-time</span>
          </div>
        </div>
        <p style={styles.headerSubtitle}>
          ระบบตรวจจับไฟและควันจากกล้องวงจรปิดแบบเรียลไทม์
        </p>
      </div>

      <div style={styles.headerActions}>
        <div style={styles.lastUpdateText}>
          <Clock size={14} color="#64748b" />
          <span>อัปเดตล่าสุด: {formatClock(lastUpdated)}</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{
            ...styles.refreshBtn,
            opacity: isRefreshing ? 0.7 : 1,
          }}
          title="กดเพื่อรีเฟรชข้อมูลล่าสุด"
        >
          <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />
          <span>รีเฟรช</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
