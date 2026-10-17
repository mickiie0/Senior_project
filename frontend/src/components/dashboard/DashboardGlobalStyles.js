import React from 'react';

const DashboardGlobalStyles = () => (
  <style>{`
    @keyframes pulse-live {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.15); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .live-dot-pulse {
      animation: pulse-live 2s infinite ease-in-out;
    }
    .spin-icon {
      animation: spin 0.8s linear infinite;
    }
    .interactive-row:hover {
      background-color: #f8fafc !important;
    }
    .dash-card:hover {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
      transition: all 0.2s ease-in-out;
    }
    .filter-btn {
      transition: all 0.15s ease;
    }
    .filter-btn:hover {
      opacity: 0.9;
    }
  `}</style>
);

export default DashboardGlobalStyles;
