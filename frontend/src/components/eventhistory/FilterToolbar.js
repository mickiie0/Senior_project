import React from 'react';
import { Filter, RotateCcw, Search, X, Calendar } from 'lucide-react';
import styles from './EventHistoryStyles';

const FilterToolbar = ({
  searchTerm,
  onSearchTermChange,
  typeFilter,
  onTypeFilterChange,
  cameraFilter,
  onCameraFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  cameras,
  onResetFilters,
}) => {
  const hasActiveFilters =
    searchTerm || typeFilter !== 'all' || cameraFilter !== 'all' || startDate || endDate;

  return (
    <div style={styles.filterCard}>
      <div style={styles.filterTitleRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#2563eb" />
          <span style={styles.filterSectionTitle}>ตัวกรองและค้นหาข้อมูล</span>
        </div>
        {hasActiveFilters && (
          <button onClick={onResetFilters} style={styles.resetFilterBtn}>
            <RotateCcw size={13} />
            <span>ล้างตัวกรอง</span>
          </button>
        )}
      </div>

      <div style={styles.filterGrid}>
        {/* Search Input */}
        <div style={styles.filterItem}>
          <label style={styles.filterLabel}>ค้นหาคำสำคัญ</label>
          <div style={styles.searchInputWrapper}>
            <Search size={16} color="#94a3b8" style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Event ID, รหัสกล้อง, สถานที่"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              style={styles.searchInput}
              className="filter-input"
            />
            {searchTerm && (
              <button onClick={() => onSearchTermChange('')} style={styles.clearSearchBtn}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Type Filter */}
        <div style={styles.filterItem}>
          <label style={styles.filterLabel}>ประเภทเหตุการณ์</label>
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            style={styles.selectInput}
            className="filter-input"
          >
            <option value="all">ทั้งหมด (All Types)</option>
            <option value="fire">🔥 เปลวไฟ (Fire)</option>
            <option value="smoke">💨 กลุ่มควัน (Smoke)</option>
            <option value="both">⚡ มีทั้งไฟและควัน (Both)</option>
          </select>
        </div>

        {/* Camera Filter */}
        <div style={styles.filterItem}>
          <label style={styles.filterLabel}>กล้องวงจรปิด</label>
          <select
            value={cameraFilter}
            onChange={(e) => onCameraFilterChange(e.target.value)}
            style={styles.selectInput}
            className="filter-input"
          >
            <option value="all">กล้องทุกตัว (All Cameras)</option>
            {cameras.map((cam) => (
              <option key={cam.camera_id || cam.id} value={cam.camera_id || cam.id}>
                {cam.camera_id || cam.id} - {cam.location} - {cam.sub_location}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div style={styles.filterItem}>
          <label style={styles.filterLabel}>ช่วงวันที่เกิดเหตุ</label>
          <div style={styles.dateRangeRow}>
            <div style={styles.dateInputWrapper}>
              <Calendar size={14} color="#94a3b8" style={styles.dateIcon} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                style={styles.dateInput}
                title="วันที่เริ่มต้น"
                className="filter-input"
              />
            </div>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>ถึง</span>
            <div style={styles.dateInputWrapper}>
              <Calendar size={14} color="#94a3b8" style={styles.dateIcon} />
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                style={styles.dateInput}
                title="วันที่สิ้นสุด"
                className="filter-input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterToolbar;
