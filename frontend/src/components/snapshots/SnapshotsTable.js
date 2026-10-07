import React from 'react';
import {
  Download,
  Eye,
  Trash2,
  Camera,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import styles from './SnapshotStyles';
import {
  formatDateTime,
  formatFileSize,
  formatTimeAgo,
  getFullImageUrl,
} from './SnapshotHelpers';

const ITEMS_PER_PAGE = 10;

const PaginationFooter = ({ totalItems, currentPage, totalPages, onPageChange }) => (
  <div style={styles.paginationBar}>
    <span style={styles.paginationInfo}>
      แสดง {totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} –{' '}
      {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} จากทั้งหมด {totalItems} รายการ
    </span>

    <div style={styles.paginationControls}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
          const isActive = p === currentPage;
          return (
            <React.Fragment key={p}>
              {showEllipsis && (
                <span style={{ padding: '0 4px', color: '#94a3b8', fontSize: '13px' }}>...</span>
              )}
              <button
                onClick={() => onPageChange(p)}
                style={{
                  ...styles.pageBtn,
                  ...(isActive ? styles.pageBtnActive : {}),
                }}
              >
                {p}
              </button>
            </React.Fragment>
          );
        })}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
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

const SnapshotsTable = ({
  loading,
  snapshots,
  totalItems,
  camerasMap,
  currentPage,
  totalPages,
  onPageChange,
  onSelectSnapshot,
  onDeleteSnapshot,
  onResetFilters,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={styles.resultsBar}>
        <span style={styles.resultsText}>
          พบทั้งหมด <strong>{totalItems}</strong> รายการ
        </span>
        <span style={styles.pageIndicator}>
          หน้า {currentPage} จาก {totalPages}
        </span>
      </div>

      <div style={styles.tableCard}>
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={{ ...styles.th, width: '68px', textAlign: 'center' }}>รูปภาพ</th>
                <th style={styles.th}>รหัสสแนปชอต</th>
                <th style={styles.th}>วันและเวลาที่บันทึก</th>
                <th style={styles.th}>กล้องและตำแหน่ง</th>
                <th style={styles.th}>ขนาดไฟล์</th>
                <th style={{ ...styles.th, textAlign: 'center', width: '130px' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div style={styles.loadingArea}>
                      <div className="spin-icon" style={{ display: 'inline-block' }}>
                        <Camera size={26} color="#2563eb" />
                      </div>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        กำลังโหลดรายการภาพถ่าย Snapshot...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : snapshots.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div style={styles.emptyArea}>
                      <div style={styles.emptyIconCircle}>
                        <Camera size={28} color="#94a3b8" />
                      </div>
                      <h4 style={styles.emptyTitle}>
                        ไม่พบข้อมูลภาพถ่าย Snapshot
                      </h4>
                      <p style={styles.emptyDesc}>
                        ยังไม่มีการส่งภาพจากกล้อง หรือไม่ตรงกับเงื่อนไขตัวกรองที่คุณเลือก
                      </p>
                      {onResetFilters && (
                        <button
                          onClick={onResetFilters}
                          style={styles.emptyResetBtn}
                        >
                          <RotateCcw size={13} />
                          <span>ล้างตัวกรอง</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                snapshots.map((item) => {
                  const cam = camerasMap[item.camera_id] || {};
                  const fullImg = getFullImageUrl(item.file_path);

                  const handleDirectDownload = (e) => {
                    e.stopPropagation();
                    if (!fullImg) return;
                    const a = document.createElement('a');
                    a.href = fullImg;
                    a.download = `${item.id || 'snapshot'}.jpg`;
                    a.target = '_blank';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  };

                  return (
                    <tr
                      key={item.id}
                      style={styles.tableRow}
                      className="interactive-row"
                    >
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <div
                          style={styles.thumbWrapper}
                          onClick={() => onSelectSnapshot(item)}
                          title="คลิกเพื่อดูภาพขยาย"
                        >
                          {fullImg ? (
                            <img
                              src={fullImg}
                              alt={item.id}
                              style={styles.thumbImage}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            style={{
                              ...styles.thumbPlaceholder,
                              display: fullImg ? 'none' : 'flex',
                            }}
                          >
                            <Camera size={18} color="#94a3b8" />
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.idBadge}>{item.id}</span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.dateMainText}>
                          {formatDateTime(item.captured_at || item.created_at)}
                        </div>
                        <div style={styles.timeAgoText}>
                          {formatTimeAgo(item.captured_at || item.created_at)}
                        </div>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.camBadge}>
                          <Camera size={13} color="#2563eb" />
                          <span>{item.camera_id}</span>
                        </div>
                        <div style={styles.locationText}>
                          <MapPin size={12} color="#94a3b8" />
                          <span>
                            {cam.location ? `${cam.location} (${cam.sub_location || '-'})` : '-'}
                          </span>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.fileSizeText}>
                          {formatFileSize(item.file_size)}
                        </span>
                      </td>

                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <div style={{ ...styles.actionBtnGroup, justifyContent: 'center' }}>
                          <button
                            onClick={() => onSelectSnapshot(item)}
                            style={{ ...styles.iconBtn, color: '#2563eb' }}
                            title="ดูภาพขยาย"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={handleDirectDownload}
                            style={{ ...styles.iconBtn, color: '#059669' }}
                            title="ดาวน์โหลดภาพต้นฉบับ"
                          >
                            <Download size={16} />
                          </button>

                          {onDeleteSnapshot && (
                            <button
                              onClick={() => onDeleteSnapshot(item.id)}
                              style={{ ...styles.iconBtn, color: '#ef4444' }}
                              title="ลบภาพนี้"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && (
          <PaginationFooter
            totalItems={totalItems}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  );
};

export default SnapshotsTable;
