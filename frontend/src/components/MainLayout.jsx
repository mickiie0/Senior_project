import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const MainLayout = ({ title, children, username = 'User', userRole = 'user' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const allMenuItems = [
    { path: '/dashboard', name: 'Dashboard', adminOnly: false },
    { path: '/events', name: 'Event History', adminOnly: false },
    { path: '/statistics', name: 'Statistics', adminOnly: false },
    { path: '/cameras', name: 'Camera Management', adminOnly: true },
  ];

  const menuItems = allMenuItems.filter((item) => {
    if (item.adminOnly && userRole.toLowerCase() !== 'admin') {
      return false;
    }
    return true;
  });

  return (
    <div style={layoutStyles.container}>
      {/* Sidebar ด้านซ้าย */}
      <aside style={layoutStyles.sidebar}>
        <div style={layoutStyles.brand}>
          <img 
            src="/logo/fire.png" 
            alt="Logo" 
            style={layoutStyles.logoImage} 
          />
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
            {/* ปุ่มผู้ใช้ขวาบน แสดง Username */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={layoutStyles.adminDropdownBtn}
              >
                <div style={layoutStyles.smallAvatar}>
                  <img 
                    src="/logo/user.png" 
                    alt="User Profile" 
                    style={layoutStyles.avatarImage} 
                  />
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                  {username}
                </span>
              </button>

              {/* Popover แสดงเฉพาะ Username และ Role */}
              {showProfileMenu && (
                <div style={layoutStyles.profileModal}>
                  <div style={layoutStyles.modalHeader}>
                    <div style={layoutStyles.largeAvatar}>
                      <img 
                        src="/logo/user.png" 
                        alt="User Profile" 
                        style={layoutStyles.largeAvatarImage} 
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                        {username}
                      </div>
                      <div style={{ marginTop: '2px' }}>
                        <span style={layoutStyles.roleBadge}>{userRole}</span>
                      </div>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '12px 0' }} />

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
  logoImage: {
    width: '36px',
    height: '36px',
    objectFit: 'contain',
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '20px',
    height: '20px',
    objectFit: 'contain',
  },
  largeAvatarImage: {
    width: '26px',
    height: '26px',
    objectFit: 'contain',
  },
  profileModal: {
    position: 'absolute',
    top: '45px',
    right: '0',
    width: '180px',
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
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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