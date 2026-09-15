import React from 'react';
import { Video, Activity, Flame, ShieldAlert, ShieldCheck } from 'lucide-react';
import styles from './DashboardStyles';

const StatsCards = ({
  totalCameras,
  activeCameras,
  maintenanceCameras,
  inactiveCameras,
  cameraOnlinePercent,
  todayDetectionsCount,
  fireTodayCount,
  smokeTodayCount,
  hasActiveFireAlert,
}) => {
  return (
    <div style={styles.statsGrid}>
      {/* Card 1: Total Cameras */}
      <div style={styles.statCard} className="dash-card">
        <div style={styles.statCardHeader}>
          <span style={styles.statCardTitle}>กล้องทั้งหมดในระบบ</span>
          <div style={{ ...styles.statIconBadge, backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <Video size={18} />
          </div>
        </div>
        <div style={styles.statCardValue}>{totalCameras}</div>
        <div style={styles.statCardFooter}>
          <span style={{ color: '#16a34a', fontWeight: '600' }}>{activeCameras} ปกติ</span>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <span style={{ color: '#d97706', fontWeight: '500' }}>{maintenanceCameras} ซ่อม</span>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <span style={{ color: '#dc2626', fontWeight: '500' }}>{inactiveCameras} ปิด</span>
        </div>
      </div>

      {/* Card 2: Camera Availability */}
      <div style={styles.statCard} className="dash-card">
        <div style={styles.statCardHeader}>
          <span style={styles.statCardTitle}>อัตรากล้องพร้อมใช้งาน</span>
          <div style={{ ...styles.statIconBadge, backgroundColor: '#ecfdf5', color: '#059669' }}>
            <Activity size={18} />
          </div>
        </div>
        <div style={{ ...styles.statCardValue, color: '#059669' }}>{cameraOnlinePercent}%</div>
        <div style={styles.progressContainer}>
          <div
            style={{
              ...styles.progressBar,
              width: `${cameraOnlinePercent}%`,
              backgroundColor:
                cameraOnlinePercent > 75 ? '#10b981' : cameraOnlinePercent > 50 ? '#f59e0b' : '#ef4444',
            }}
          />
        </div>
        <div style={styles.statCardSubText}>
          พร้อมใช้งาน {activeCameras} จาก {totalCameras} ตัว
        </div>
      </div>

      {/* Card 3: Detections Today */}
      <div style={styles.statCard} className="dash-card">
        <div style={styles.statCardHeader}>
          <span style={styles.statCardTitle}>ตรวจพบวันนี้</span>
          <div
            style={{
              ...styles.statIconBadge,
              backgroundColor: todayDetectionsCount > 0 ? '#fee2e2' : '#f8fafc',
              color: todayDetectionsCount > 0 ? '#dc2626' : '#64748b',
            }}
          >
            <Flame size={18} />
          </div>
        </div>
        <div
          style={{
            ...styles.statCardValue,
            color: todayDetectionsCount > 0 ? '#dc2626' : '#0f172a',
          }}
        >
          {todayDetectionsCount}
        </div>
        <div style={styles.detectionPillsRow}>
          <span style={styles.miniFirePill}>🔥 ไฟ {fireTodayCount}</span>
          <span style={styles.miniSmokePill}>💨 ควัน {smokeTodayCount}</span>
        </div>
      </div>

      {/* Card 4: Security Status */}
      <div style={styles.statCard} className="dash-card">
        <div style={styles.statCardHeader}>
          <span style={styles.statCardTitle}>ระดับการแจ้งเตือน</span>
          <div
            style={{
              ...styles.statIconBadge,
              backgroundColor: hasActiveFireAlert ? '#fef2f2' : '#f0fdf4',
              color: hasActiveFireAlert ? '#dc2626' : '#16a34a',
            }}
          >
            {hasActiveFireAlert ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
          </div>
        </div>
        <div
          style={{
            ...styles.statCardValue,
            fontSize: '22px',
            color: hasActiveFireAlert ? '#dc2626' : '#16a34a',
            marginTop: '10px',
          }}
        >
          {hasActiveFireAlert ? 'เฝ้าระวังฉุกเฉิน' : 'ระดับปกติ'}
        </div>
        <div style={styles.statCardSubText}>
          {hasActiveFireAlert ? 'ตรวจพบเหตุการณ์ใน 24 ชม.' : 'ไม่พบเหตุการณ์ผิดปกติ'}
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
