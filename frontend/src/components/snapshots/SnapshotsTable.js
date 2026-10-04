import React from 'react';
import {
  Download,
  Eye,
  Trash2,
  Camera,
  MapPin,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import styles from './SnapshotStyles';
import {
  formatDateTime,
  formatFileSize,
  formatTimeAgo,
  getFullImageUrl,
} from './SnapshotHelpers';

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
  onExportCSV,
  onResetFilters,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Action Bar Above Table: Download CSV on the Left! */}
      <div style={styles.tableActionBar}>
        <div>
          <button
            onClick={onExportCSV}
            style={styles.csvExportBtn}
            title="ดาวน์โหลดรายการภาพถ่ายเป็นไฟล์ CSV"
          >
            <FileSpreadsheet size={16} />
            <span>ดาวน์โหลด CSV</span>
          </button>
        </div>

        <div>
          <span style={styles.resultsCountText}>
            พบทั้งหมด <strong>{totalItems}</strong> รายการ
          </span>
          <span style={styles.resultsPaginationText}>
            หน้า {currentPage} จาก {totalPages}
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div style={styles.tableCard}>
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={{ ...styles.th, width: '68px', textAlign: 'center' }}>ภาพ</th>
                <th style={styles.th}>Snapshot ID</th>
                <th style={styles.th}>วันที่และเวลาที่บันทึก</th>
                <th style={styles.th}>กล้องและสถานที่</th>
                <th style={styles.th}>ขนาดไฟล์</th>
                <th style={{ ...styles.th, textAlign: 'center', width: '130px' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div className="spin-icon" style={{ display: 'inline-block' }}>
                        <Camera size={24} color="#2563eb" />
                      </div>
                      <span>กำลังโหลดรายการภาพถ่าย Snapshot...</span>
                    </div>
                  </td>
                </tr>
              ) : snapshots.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Camera size={36} color="#cbd5e1" />
                      <span style={{ fontWeight: '600', fontSize: '15px', color: '#334155' }}>
                        ไม่พบข้อมูลภาพถ่าย Snapshot
                      </span>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                        ยังไม่มีการส่งภาพจากกล้อง หรือไม่ตรงกับเงื่อนไขตัวกรองที่คุณเลือก
                      </span>
                      {onResetFilters && (
                        <button
                          onClick={onResetFilters}
                          style={{
                            marginTop: '8px',
                            padding: '6px 14px',
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#2563eb',
                            cursor: 'pointer',
                          }}
                        >
                          ล้างตัวกรอง
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
                      {/* Column 1: Thumbnail */}
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

                      {/* Column 2: Snapshot ID */}
                      <td style={styles.td}>
                        <span style={styles.idBadge}>{item.id}</span>
                      </td>

                      {/* Column 3: Captured At */}
                      <td style={styles.td}>
                        <div style={styles.dateMainText}>
                          {formatDateTime(item.captured_at || item.created_at)}
                        </div>
                        <div style={styles.timeAgoText}>
                          {formatTimeAgo(item.captured_at || item.created_at)}
                        </div>
                      </td>

                      {/* Column 4: Camera & Location */}
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

                      {/* Column 5: File Size */}
                      <td style={styles.td}>
                        <span style={styles.fileSizeText}>
                          {formatFileSize(item.file_size)}
                        </span>
                      </td>

                      {/* Column 6: Actions (Preview, Download, Delete) */}
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={styles.paginationBar}>
            <span style={styles.paginationInfo}>
              แสดงหน้า {currentPage} จากทั้งหมด {totalPages} หน้า
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

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    style={{
                      ...styles.pageBtn,
                      ...(isActive ? styles.pageBtnActive : {}),
                    }}
                  >
                    {pageNum}
                  </button>
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
        )}
      </div>
    </div>
  );
};

export default SnapshotsTable;
