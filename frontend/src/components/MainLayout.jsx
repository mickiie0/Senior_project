import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const MainLayout = ({ title, children, userRole = 'Admin', userId = 'N/A' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // State สำหรับเปิด-ปิด ป๊อบอัพโปรไฟล์
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/events', name: 'Event History' },
    { path: '/statistics', name: 'Statistics' },
    { path: '/cameras', name: 'Camera Management' },
  ];

  return (
    <div style={layoutStyles.container}>
      {/* Sidebar ด้านซ้าย */}
      <aside style={layoutStyles.sidebar}>
        <div style={layoutStyles.brand}>
          <div style={layoutStyles.logoBox}>
            <span style={{ fontSize: '20px' }}>🔥</span>
          </div>
          <div>
            <div style={layoutStyles.brandTitle}>FIRE & SMOKE</div>
            <div style={layoutStyles.brandSubtitle}>MONITORING SYSTEM</div>
          </div>
        </div>

        <nav style={layoutStyles.nav}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...layoutStyles.menuItem,
                  ...(isActive ? layoutStyles.activeMenuItem : {}),
                }}
              >
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div style={layoutStyles.mainContent}>
        {/* Header */}
        <header style={layoutStyles.header}>
          <h1 style={layoutStyles.headerTitle}>{title}</h1>

          <div style={layoutStyles.headerRight}>
            <div style={layoutStyles.notificationBadge}>
              <span style={{ fontSize: '18px' }}>🔔</span>
              <span style={layoutStyles.badgeCount}>3</span>
            </div>

            {/* ปุ่มไอคอน User ด้านบนขวา (กดเพื่อสลับการแสดงข้อมูล) */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={layoutStyles.adminDropdownBtn}
              >
                <div style={layoutStyles.smallAvatar}>👤</div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                  {userRole}
                </span>
              </button>

              {/* ป๊อบอัพแสดงข้อมูลผู้ใช้เมื่อกดคลิก */}
              {showProfileMenu && (
                <div style={layoutStyles.profileModal}>
                  <div style={layoutStyles.modalHeader}>
                    <div style={layoutStyles.largeAvatar}>👤</div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                        {userRole}
                      </div>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '12px 0' }} />

                  <div style={layoutStyles.modalBody}>
                    <div style={layoutStyles.infoRow}>
                      <span style={layoutStyles.infoLabel}>User ID:</span>
                      <span style={layoutStyles.infoValue}>{userId}</span>
                    </div>
                    <div style={layoutStyles.infoRow}>
                      <span style={layoutStyles.infoLabel}>Role:</span>
                      <span style={layoutStyles.roleBadge}>{userRole}</span>
                    </div>
                    <div style={layoutStyles.infoRow}>
                      <span style={layoutStyles.infoLabel}>Status:</span>
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>● Active</span>
                    </div>
                  </div>

                  <button onClick={handleLogout} style={layoutStyles.modalLogoutBtn}>
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main style={layoutStyles.body}>{children}</main>
      </div>
    </div>
  );
};

const layoutStyles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#0b1329',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '36px',
    paddingLeft: '8px',
  },
  logoBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
  },
  brandSubtitle: {
    fontSize: '9px',
    color: '#94a3b8',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  menuItem: {
    padding: '12px 16px',
    borderRadius: '10px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
  activeMenuItem: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: '600',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 'auto',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
  },
  userRole: {
    fontSize: '11px',
    color: '#64748b',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '16px',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    height: '70px',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 36px',
    borderBottom: '1px solid #e2e8f0',
  },
  headerTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  notificationBadge: {
    position: 'relative',
    cursor: 'pointer',
  },
  badgeCount: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '700',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminDropdownBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '8px',
  },
  smallAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileModal: {
    position: 'absolute',
    top: '45px',
    right: '0',
    width: '240px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    padding: '16px',
    zIndex: 1000,
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  largeAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
  },
  infoLabel: {
    color: '#64748b',
  },
  infoValue: {
    fontWeight: '600',
    color: '#0f172a',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  roleBadge: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalLogoutBtn: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#fef2f2',
    color: '#ef4444',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  body: {
    padding: '32px 36px',
    flex: 1,
  },
};

export default MainLayout;