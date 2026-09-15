import React from 'react';
import { RefreshCw } from 'lucide-react';
import styles from './CameraManagementStyles';

const CameraManagementHeader = ({ isRefreshing, onRefresh }) => {
  return (
    <div style={styles.headerBar}>
      <div>
        <h1 style={styles.headerTitle}>จัดการกล้องวงจรปิด</h1>
        <p style={styles.headerSubtitle}>
          เพิ่ม แก้ไข ตรวจสอบการเชื่อมต่อเครือข่าย และสถานะการทำงานของกล้องในระบบ
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

export default CameraManagementHeader;
