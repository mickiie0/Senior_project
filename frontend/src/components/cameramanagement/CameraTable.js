import React from 'react';
import { RefreshCw, Camera, Wifi, MapPin, Edit2, Trash2 } from 'lucide-react';
import styles from './CameraManagementStyles';
import { CAMERA_STATUS } from './CameraManagementHelpers';
import StatusBadge from './StatusBadge';

const CameraTable = ({ loading, cameras, filteredCameras, onEdit, onDelete }) => {
  return (
    <div style={styles.tableCard}>
      {loading ? (
        <div style={styles.loadingArea}>
          <RefreshCw size={28} className="spin-icon" color="#2563eb" />
          <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>
            กำลังเชื่อมต่อและโหลดข้อมูลกล้อง...
          </p>
        </div>
      ) : filteredCameras.length === 0 ? (
        <div style={styles.emptyArea}>
          <div style={styles.emptyIconCircle}>
            <Camera size={36} color="#94a3b8" />
          </div>
          <h3 style={styles.emptyTitle}>ไม่พบข้อมูลกล้องตามเงื่อนไข</h3>
          <p style={styles.emptyDesc}>
            {cameras.length === 0
              ? 'ยังไม่มีกล้องที่ลงทะเบียนไว้ในระบบ สามารถเพิ่มกล้องใหม่ได้จากฟอร์มด้านบน'
              : 'กรุณาลองปรับเปลี่ยนคำค้นหา หรือกดปุ่ม "ล้างตัวกรอง" เพื่อแสดงรายการกล้องทั้งหมด'}
          </p>
        </div>
      ) : (
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={styles.th}>Camera ID</th>
                <th style={styles.th}>IP Address</th>
                <th style={styles.th}>ตำแหน่งที่ติดตั้ง (Location)</th>
                <th style={styles.th}>สถานะ (Status)</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredCameras.map((cam) => (
                <tr key={cam.camera_id} style={styles.tableRow} className="interactive-row">
                  {/* Camera ID */}
                  <td style={styles.td}>
                    <div style={styles.camIdBadge}>
                      <Camera size={13} color="#2563eb" />
                      <span>{cam.camera_id}</span>
                    </div>
                  </td>

                  {/* IP Address */}
                  <td style={styles.td}>
                    <div style={styles.ipBadge}>
                      <Wifi size={13} color={cam.status === CAMERA_STATUS.ACTIVE ? '#16a34a' : '#94a3b8'} />
                      <span style={styles.ipText}>{cam.ip_address || '-'}</span>
                    </div>
                  </td>

                  {/* Location & Sub Location */}
                  <td style={styles.td}>
                    <div style={styles.locationBlock}>
                      <div style={styles.locationMain}>
                        <MapPin size={13} color="#475569" />
                        <span>{cam.location}</span>
                      </div>
                      <div style={styles.subLocationText}>{cam.sub_location}</div>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={styles.td}>
                    <StatusBadge status={cam.status} />
                  </td>

                  {/* Actions */}
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <div style={styles.actionButtonsRow}>
                      <button onClick={() => onEdit(cam)} style={styles.btnEdit} title="แก้ไขข้อมูลกล้อง">
                        <Edit2 size={13} />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        onClick={() => onDelete(cam.camera_id)}
                        style={styles.btnDelete}
                        title="ลบกล้องออกจากระบบ"
                      >
                        <Trash2 size={13} />
                        <span>ลบ</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Footer */}
      <div style={styles.cardFooter}>
        <span style={styles.cardFooterNote}>
          แสดงผล <strong>{filteredCameras.length}</strong> จากทั้งหมด {cameras.length} กล้อง
        </span>
      </div>
    </div>
  );
};

export default CameraTable;
