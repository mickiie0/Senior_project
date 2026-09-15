import React from 'react';

const CameraManagementGlobalStyles = () => (
  <style>{`
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spin-icon {
      animation: spin 0.8s linear infinite;
    }
    .dash-card:hover {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
      transition: all 0.2s ease-in-out;
    }
    .interactive-row:hover {
      background-color: #f8fafc !important;
    }
    .cam-input:focus {
      border-color: #2563eb !important;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
    }
  `}</style>
);

export default CameraManagementGlobalStyles;
