import React from 'react';
import { Search, RotateCcw, Calendar, Video, Filter } from 'lucide-react';
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
  const hasActiveFilters = searchTerm || cameraFilter !== 'all' || startDate || endDate;

  return (
    <div style={styles.filterCard}>
      <div style={styles.filterTitleRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#2563eb" />
          <span style={styles.filterSectionTitle}>ตัวกรองและค้นหาข้อมูล</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            style={styles.resetFilterBtn}
            title="ล้างตัวกรองทั้งหมด"
          >
            <RotateCcw size={12} />
            <span>ล้างตัวกรอง</span>
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          alignItems: 'flex-end',
        }}
      >
        <div style={styles.filterItem}>
          <label style={styles.filterLabel}>ค้นหา</label>
          <div style={styles.searchInputWrapper}>
            <Search size={16} style={{ ...styles.searchIcon, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="ค้นหาด้วย รหัสสแนปชอต, รหัสกล้อง"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        <div style={styles.filterItem}>
          <label style={styles.filterLabel}>
            <Video size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            กล้องวงจรปิด
          </label>
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

        <div style={styles.filterItem}>
          <label style={styles.filterLabel}>
            <Calendar size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            ช่วงวันที่เกิดเหตุ
          </label>
          <div style={styles.dateRangeRow}>
            <div style={styles.dateInputWrapper}>
              <Calendar size={14} style={{ ...styles.dateIcon, color: '#94a3b8' }} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                style={styles.dateInput}
                title="ตั้งแต่วันที่"
              />
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8', flexShrink: 0 }}>ถึง</span>
            <div style={styles.dateInputWrapper}>
              <Calendar size={14} style={{ ...styles.dateIcon, color: '#94a3b8' }} />
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                style={styles.dateInput}
                title="ถึงวันที่"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnapshotFilterToolbar;
