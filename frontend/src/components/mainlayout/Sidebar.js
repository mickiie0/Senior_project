import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import S from './MainLayoutStyles';

const Sidebar = ({ menuItems, currentPath }) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <aside style={S.sidebar}>
      <div style={S.brand}>
        <div style={S.logoContainer}>
          {!logoError ? (
            <img
              src="/logo/fire.png"
              alt="Logo"
              style={S.logoImage}
              onError={() => setLogoError(true)}
            />
          ) : (
            <div style={S.logoFallback}>
              <Flame size={20} color="#f97316" />
            </div>
          )}
        </div>
        <div>
          <div style={S.brandTitle}>FIRE & SMOKE</div>
          <div style={S.brandSubtitle}>DETECTION SYSTEM FROM CCTV CAMERAS</div>
        </div>
      </div>

      <nav style={S.nav}>
        <div style={S.navSectionHeader}>MAIN MENU</div>
        {menuItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive ? 'active-link' : ''}`}
              style={{
                ...S.menuItem,
                ...(isActive ? S.activeMenuItem : {}),
              }}
            >
              <Icon
                size={18}
                style={{
                  flexShrink: 0,
                  color: isActive ? '#ffffff' : '#94a3b8',
                }}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div style={S.sidebarFooter}>
        <div style={S.systemStatusBox}>
          <div style={S.systemStatusTop}>
            <span style={S.statusDot} className="sidebar-pulse-dot" />
            <span style={S.statusLabel}>SURVEILLANCE ACTIVE</span>
          </div>
          <div style={S.statusSub}>Object Detection System v1.0</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
