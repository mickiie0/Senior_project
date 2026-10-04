import React from 'react';
import { RefreshCw } from 'lucide-react';
import styles from './SnapshotStyles';

const SnapshotsHeader = ({ isRefreshing, onRefresh }) => {
  return (
    <div style={styles.headerBar}>
      <div>
        <h1 style={styles.headerTitle}>บันทึกภาพถ่ายเป็นระยะ (Camera Snapshots)</h1>
        <p style={styles.headerSubtitle}>
          ภาพถ่ายปกติทุก 10 นาทีเมื่อไม่พบเพลิงไหม้ (Negative Samples สำหรับ Retrain Model) ข้อมูลมีอายุจัดเก็บ 90 วัน
        </p>
      </div>

      <div style={styles.headerActions}>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          style={styles.refreshBtn}
          title="กดเพื่อรีเฟรชข้อมูลล่าสุด"
        >
          <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />
          <span>รีเฟรช</span>
        </button>
      </div>
    </div>
  );
};

export default SnapshotsHeader;
