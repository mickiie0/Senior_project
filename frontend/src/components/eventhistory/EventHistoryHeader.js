import React from 'react';
import { RefreshCw, Download } from 'lucide-react';
import styles from './EventHistoryStyles';

const EventHistoryHeader = ({ isRefreshing, onRefresh, onExportCSV }) => {
  return (
    <div style={styles.headerBar}>
      <div>
        <h1 style={styles.headerTitle}>ประวัติเหตุการณ์ตรวจจับ</h1>
        <p style={styles.headerSubtitle}>
          ค้นหา กรอง และตรวจสอบบันทึกหลักฐานการตรวจจับไฟและควันย้อนหลังทั้งหมด
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

        <button
          onClick={onExportCSV}
          style={styles.exportBtn}
          title="ดาวน์โหลดข้อมูลเป็นไฟล์ Excel / CSV"
        >
          <Download size={15} />
          <span>ส่งออก CSV</span>
        </button>
      </div>
    </div>
  );
};

export default EventHistoryHeader;
