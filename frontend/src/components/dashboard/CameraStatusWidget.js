import React from 'react';
import { Link } from 'react-router-dom';
import { Video, Camera, MapPin, ArrowUpRight } from 'lucide-react';
import styles from './DashboardStyles';
import { isCameraOnline } from './DashboardHelpers';

const CameraListItem = ({ cam }) => {
  const online = isCameraOnline(cam);
  const isMaint = cam.status === 'maintenance';

  return (
    <div style={styles.camListItem}>
      <div style={styles.camItemLeft}>
        <div
          style={{
            ...styles.camStatusDot,
            backgroundColor: online ? '#10b981' : isMaint ? '#f59e0b' : '#ef4444',
          }}
          title={`สถานะ: ${cam.status}`}
        />
        <div>
          <div style={styles.camItemName}>
            <span>{cam.camera_id || cam.id}</span>
            <span style={styles.camIpTag}>{cam.ip_address || 'IP ไม่ระบุ'}</span>
          </div>
          <div style={styles.camItemLocation}>
            <MapPin size={11} color="#94a3b8" />
            <span>
              {cam.location} • {cam.sub_location}
            </span>
          </div>
        </div>
      </div>

      <div>
        <span
          style={{
            ...styles.camMiniBadge,
            backgroundColor: online ? '#dcfce7' : isMaint ? '#fef3c7' : '#fee2e2',
            color: online ? '#15803d' : isMaint ? '#b45309' : '#b91c1c',
          }}
        >
          {online ? 'Active' : isMaint ? 'Maintenance' : 'Inactive'}
        </span>
      </div>
    </div>
  );
};

const CameraStatusWidget = ({ cameras, totalCameras }) => {
  return (
    <div style={styles.sideCard} className="dash-card">
      <div style={styles.sideCardHeader}>
        <div style={styles.cardTitleWithIcon}>
          <Video size={17} color="#059669" />
          <h3 style={styles.sideCardTitle}>สถานะกล้องในระบบ ({totalCameras})</h3>
        </div>
        <Link to="/cameras" style={styles.smallManageLink}>
          <span>จัดการกล้อง</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {cameras.length === 0 ? (
        <div style={styles.sideEmpty}>
          <Camera size={24} color="#94a3b8" />
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            ไม่พบกล้องที่ลงทะเบียนไว้ในระบบ
          </p>
        </div>
      ) : (
        <div style={styles.cameraListScroll}>
          {cameras.map((cam) => (
            <CameraListItem key={cam.camera_id || cam.id} cam={cam} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CameraStatusWidget;
