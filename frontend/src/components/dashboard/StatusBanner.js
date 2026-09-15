import React from 'react';
import { Flame, ShieldCheck, CheckCircle2, Eye } from 'lucide-react';
import styles from './DashboardStyles';
import { formatTimeAgo } from './DashboardHelpers';

const StatusBanner = ({ hasActiveFireAlert, latestAlertEvent, camerasMap, onViewEvent }) => {
  if (hasActiveFireAlert) {
    return (
      <div style={styles.dangerAlertBanner}>
        <div style={styles.alertBannerIconWrapperDanger}>
          <Flame size={24} color="#dc2626" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={styles.alertTitleDanger}>🚨 ตรวจพบสัญญาณเพลิงไหม้ในระบบ</div>
          <div style={styles.alertSubtitleDanger}>
            {latestAlertEvent ? (
              <>
                เหตุการณ์ล่าสุด: <strong>{latestAlertEvent.event_id}</strong> ที่กล้อง{' '}
                <strong>{latestAlertEvent.camera_id}</strong> (
                {camerasMap[latestAlertEvent.camera_id]?.location || 'ไม่ระบุตำแหน่ง'} -{' '}
                {camerasMap[latestAlertEvent.camera_id]?.sub_location || '-'}) เวลา{' '}
                {formatTimeAgo(latestAlertEvent.created_at)}
              </>
            ) : (
              'กรุณาตรวจสอบหน้างานและตำแหน่งกล้องที่แจ้งเตือนโดยทันที'
            )}
          </div>
        </div>
        {latestAlertEvent && (
          <button onClick={() => onViewEvent(latestAlertEvent)} style={styles.alertActionBtnDanger}>
            <Eye size={15} />
            <span>ดูภาพเหตุการณ์</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={styles.safeAlertBanner}>
      <div style={styles.alertBannerIconWrapperSafe}>
        <ShieldCheck size={22} color="#16a34a" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={styles.alertTitleSafe}>สถานะความปลอดภัยปกติ (Secure)</div>
        <div style={styles.alertSubtitleSafe}>
          ทุกพื้นที่อยู่ภายใต้การเฝ้าระวัง ไม่พบสัญญาณไฟหรือควันในขณะนี้
        </div>
      </div>
      <div style={styles.safeBadgePill}>
        <CheckCircle2 size={14} color="#16a34a" />
        <span>All Systems Nominal</span>
      </div>
    </div>
  );
};

export default StatusBanner;
