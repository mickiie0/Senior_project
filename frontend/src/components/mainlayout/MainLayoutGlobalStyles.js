import React from 'react';

const MainLayoutGlobalStyles = () => (
  <style>{`
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.2); }
    }
    .sidebar-pulse-dot {
      animation: pulse-dot 2s infinite ease-in-out;
    }
    .sidebar-link {
      transition: all 0.2s ease;
    }
    .sidebar-link:hover {
      background-color: rgba(255, 255, 255, 0.08) !important;
      color: #ffffff !important;
    }
    .sidebar-link.active-link:hover {
      background-color: #2563eb !important;
    }
    .pw-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .pw-wrap input {
      flex: 1;
      padding-right: 42px !important;
    }
    .pw-eye {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      align-items: center;
      padding: 0;
    }
    .pw-eye:hover {
      color: #475569;
    }
    .profile-menu-item {
      width: 100%;
      padding: 9px 12px;
      background: transparent;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.15s ease;
    }
    .profile-menu-item:hover {
      background-color: #f1f5f9;
      color: #0f172a;
    }
    .profile-menu-logout {
      color: #ef4444 !important;
    }
    .profile-menu-logout:hover {
      background-color: #fef2f2 !important;
      color: #dc2626 !important;
    }
  `}</style>
);

export default MainLayoutGlobalStyles;
