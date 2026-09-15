import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import styles from './CameraManagementStyles';
import { CAMERA_STATUS } from './CameraManagementHelpers';

const CameraFilterToolbar = ({
  searchTerm,
  onSearchTermChange,
  selectedFilter,
  onSelectedFilterChange,
  totalCount,
  activeCount,
  maintenanceCount,
  inactiveCount,
  onResetFilters,
}) => {
  const hasActiveFilters = searchTerm || selectedFilter !== 'all';

  return (
    <div style={styles.filterCard}>
      <div style={styles.filterLeft}>
        <div style={styles.searchInputWrapper}>
          <Search size={15} color="#94a3b8" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="ค้นหาด้วยรหัสกล้อง, IP Address, สถานที่"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            style={styles.searchInput}
            className="cam-input"
          />
          {searchTerm && (
            <button onClick={() => onSearchTermChange('')} style={styles.clearSearchBtn}>
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={selectedFilter}
          onChange={(e) => onSelectedFilterChange(e.target.value)}
          style={styles.filterSelect}
          className="cam-input"
        >
          <option value="all">สถานะทั้งหมด ({totalCount})</option>
          <option value={CAMERA_STATUS.ACTIVE}>เฉพาะพร้อมใช้งาน ({activeCount})</option>
          <option value={CAMERA_STATUS.MAINTENANCE}>เฉพาะส่งซ่อม ({maintenanceCount})</option>
          <option value={CAMERA_STATUS.INACTIVE}>เฉพาะปิดใช้งาน ({inactiveCount})</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button onClick={onResetFilters} style={styles.resetFilterBtn}>
          <RotateCcw size={13} />
          <span>ล้างตัวกรอง</span>
        </button>
      )}
    </div>
  );
};

export default CameraFilterToolbar;
