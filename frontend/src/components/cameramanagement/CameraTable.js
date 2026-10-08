import React, { useState, useEffect } from 'react';
import { RefreshCw, Camera, Wifi, MapPin, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './CameraManagementStyles';
import { CAMERA_STATUS } from './CameraManagementHelpers';
import StatusBadge from './StatusBadge';

const ITEMS_PER_PAGE = 10;

const PaginationFooter = ({ filteredCount, totalCount, currentPage, totalPages, onPageChange }) => (
  <div style={styles.paginationFooter}>
    <div style={styles.paginationInfo}>
      แสดง {filteredCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} –{' '}
      {Math.min(currentPage * ITEMS_PER_PAGE, filteredCount)} จากทั้งหมด {filteredCount} กล้อง
      {filteredCount !== totalCount && ` (กรองจาก ${totalCount} กล้อง)`}
    </div>

    <div style={styles.paginationControls}>
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        style={{
          ...styles.pageBtn,
          opacity: currentPage === 1 ? 0.4 : 1,
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
        }}
        title="หน้าก่อนหน้า"
      >
        <ChevronLeft size={16} />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
        .map((p, idx, arr) => {
          const prevP = arr[idx - 1];
          const showEllipsis = prevP && p - prevP > 1;
          return (
            <React.Fragment key={p}>
              {showEllipsis && <span style={styles.pageEllipsis}>...</span>}
              <button
                onClick={() => onPageChange(p)}
                style={{
                  ...styles.pageNumBtn,
                  ...(currentPage === p ? styles.pageNumBtnActive : {}),
                }}
              >
                {p}
              </button>
            </React.Fragment>
          );
        })}

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        style={{
          ...styles.pageBtn,
          opacity: currentPage === totalPages ? 0.4 : 1,
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
        }}
        title="หน้าถัดไป"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

const CameraTable = ({ loading, cameras, filteredCameras, onEdit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredCameras]);

  const totalPages = Math.max(1, Math.ceil(filteredCameras.length / ITEMS_PER_PAGE));
  const paginatedCameras = filteredCameras.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
          <h3 style={styles.emptyTitle}>ไม่พบข้อมูลกล้อง</h3>
          <p style={styles.emptyDesc}>
            {cameras.length === 0
              ? 'ยังไม่มีกล้องที่ลงทะเบียนไว้ในระบบ สามารถเพิ่มกล้องใหม่ได้จากแบบฟอร์ม'
              : 'กรุณาลองปรับเปลี่ยนคำค้นหา หรือกดปุ่ม "ล้างตัวกรอง" เพื่อแสดงรายการกล้องทั้งหมด'}
          </p>
        </div>
      ) : (
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={styles.th}>รหัสกล้อง</th>
                <th style={styles.th}>ที่อยู่ไอพี</th>
                <th style={styles.th}>ตำแหน่งที่ติดตั้ง</th>
                <th style={styles.th}>สถานะ</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCameras.map((cam) => (
                <tr key={cam.camera_id} style={styles.tableRow} className="interactive-row">
                  <td style={styles.td}>
                    <div style={styles.camIdBadge}>
                      <Camera size={13} color="#2563eb" />
                      <span>{cam.camera_id}</span>
                    </div>
                  </td>

                  <td style={styles.td}>
                    <div style={styles.ipBadge}>
                      <Wifi size={13} color={cam.status === CAMERA_STATUS.ACTIVE ? '#16a34a' : '#94a3b8'} />
                      <span style={styles.ipText}>{cam.ip_address || '-'}</span>
                    </div>
                  </td>

                  <td style={styles.td}>
                    <div style={styles.locationBlock}>
                      <div style={styles.locationMain}>
                        <MapPin size={13} color="#475569" />
                        <span>{cam.location}</span>
                      </div>
                      <div style={styles.subLocationText}>{cam.sub_location}</div>
                    </div>
                  </td>

                  <td style={styles.td}>
                    <StatusBadge status={cam.status} />
                  </td>

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

      <PaginationFooter
        filteredCount={filteredCameras.length}
        totalCount={cameras.length}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default CameraTable;
