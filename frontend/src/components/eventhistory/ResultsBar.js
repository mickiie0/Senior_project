import React from 'react';
import styles from './EventHistoryStyles';

const ResultsBar = ({ filteredCount, totalCount, currentPage, totalPages }) => {
  return (
    <div style={styles.resultsBar}>
      <span style={styles.resultsText}>
        พบทั้งหมด <strong>{filteredCount}</strong> รายการ
        {filteredCount !== totalCount && ` (กรองจาก ${totalCount} รายการ)`}
      </span>
      <span style={styles.pageIndicator}>
        หน้า {currentPage} จาก {totalPages}
      </span>
    </div>
  );
};

export default ResultsBar;
