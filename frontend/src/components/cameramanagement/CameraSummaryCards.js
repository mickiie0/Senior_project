import React from 'react';
import { Video, CheckCircle2, AlertTriangle, WifiOff } from 'lucide-react';
import styles from './CameraManagementStyles';
import { CAMERA_STATUS } from './CameraManagementHelpers';

const CameraSummaryCards = ({ totalCount, activeCount, maintenanceCount, inactiveCount, uptimePercent }) => {
  const summaryCards = [
    {
      key: 'all',
      title: 'กล้องทั้งหมดในระบบ',
      count: totalCount,
      sub: 'ลงทะเบียนในระบบทั้งหมด',
      icon: Video,
      color: '#2563eb',
      bgColor: '#eff6ff',
    },
    {
      key: CAMERA_STATUS.ACTIVE,
      title: 'พร้อมใช้งาน (Active)',
      count: activeCount,
      sub: `ความพร้อมใช้งาน ${uptimePercent}%`,
      icon: CheckCircle2,
      color: '#16a34a',
      bgColor: '#f0fdf4',
    },
    {
      key: CAMERA_STATUS.MAINTENANCE,
      title: 'ส่งซ่อมบำรุง (Maintenance)',
      count: maintenanceCount,
      sub: 'อยู่ระหว่างตรวจสอบ/ซ่อม',
      icon: AlertTriangle,
      color: '#d97706',
      bgColor: '#fef3c7',
    },
    {
      key: CAMERA_STATUS.INACTIVE,
      title: 'ปิดใช้งาน (Inactive)',
      count: inactiveCount,
      sub: 'ออฟไลน์หรือถูกปิดการทำงาน',
      icon: WifiOff,
      color: '#dc2626',
      bgColor: '#fee2e2',
    },
  ];

  return (
    <div style={styles.statsGrid}>
      {summaryCards.map(({ key, title, count, sub, icon: Icon, color, bgColor }) => (
        <div
          key={key}
          style={{ ...styles.statCard, cursor: 'default' }}
          className="dash-card"
        >
          <div style={styles.statCardHeader}>
            <span style={styles.statCardTitle}>{title}</span>
            <div style={{ ...styles.statIconBadge, backgroundColor: bgColor, color }}>
              <Icon size={18} />
            </div>
          </div>
          <div style={{ ...styles.statCardValue, color }}>
            {count} <span style={styles.statCardUnit}>ตัว</span>
          </div>
          <div style={styles.statCardSubText}>{sub}</div>
        </div>
      ))}
    </div>
  );
};

export default CameraSummaryCards;
