import React from 'react';
import { Search, RotateCcw, Calendar, Video } from 'lucide-react';
import styles from './SnapshotStyles';

const SnapshotFilterToolbar = ({
  searchTerm,
  onSearchTermChange,
  cameraFilter,
  onCameraFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  cameras,
  onResetFilters,
}) => {
  return (
    <div style={styles.toolbarCard}>
      <div style={styles.toolbarRow}>
        {/* Search */}
        <div style={styles.searchWrapper}>
          <Search size={16} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="ค้นหาตาม Snapshot ID หรือรหัสกล้อง..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Camera Dropdown */}
        <div style={styles.filterGroup}>
          <Video size={15} color="#64748b" />
          <span style={styles.filterLabel}>กล้อง:</span>
          <select
            value={cameraFilter}
            onChange={(e) => onCameraFilterChange(e.target.value)}
            style={styles.selectInput}
          >
            <option value="all">กล้องทั้งหมด ({cameras.length})</option>
            {cameras.map((cam) => (
              <option key={cam.camera_id || cam.id} value={cam.camera_id || cam.id}>
                {cam.camera_id || cam.id} - {cam.location} ({cam.sub_location})
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div style={styles.filterGroup}>
          <div style={styles.dateInputWrapper}>
            <Calendar size={14} style={styles.dateIcon} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              style={styles.dateInput}
              title="ตั้งแต่วันที่"
            />
          </div>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>ถึง</span>
          <div style={styles.dateInputWrapper}>
            <Calendar size={14} style={styles.dateIcon} />
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              style={styles.dateInput}
              title="ถึงวันที่"
            />
          </div>
        </div>

        {/* Reset button */}
        {(searchTerm || cameraFilter !== 'all' || startDate || endDate) && (
          <button
            onClick={onResetFilters}
            style={styles.resetBtn}
            title="ล้างตัวกรองทั้งหมด"
          >
            <RotateCcw size={13} />
            <span>ล้างค่า</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SnapshotFilterToolbar;
