import React from 'react';

const EventHistoryGlobalStyles = () => (
  <style>{`
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spin-icon {
      animation: spin 0.8s linear infinite;
    }
    .interactive-row:hover {
      background-color: #f8fafc !important;
    }
    .filter-input:focus {
      border-color: #2563eb !important;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
    }
    .dash-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }
  `}</style>
);

export default EventHistoryGlobalStyles;
