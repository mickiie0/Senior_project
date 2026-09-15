import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  History,
  Video,
  Flame,
  LogOut,
  ChevronDown,
  Shield,
} from 'lucide-react';

const MainLayout = ({ title, children, username = 'User', userRole = 'user' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const allMenuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { path: '/events', name: 'Event History', icon: History, adminOnly: false },
    { path: '/cameras', name: 'Camera Management', icon: Video, adminOnly: true },
  ];

  const menuItems = allMenuItems.filter((item) => {
    if (item.adminOnly && userRole?.toLowerCase() !== 'admin') {
      return false;
    }
    return true;
  });

  const currentPageTitle =
    title ||
    allMenuItems.find((m) => m.path === location.pathname)?.name ||
    'Surveillance System';

  return (
    <div style={layoutStyles.container}>
      {/* Dynamic Keyframe styles for Sidebar and Layout */}
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
      `}</style>

      {/* Sidebar ด้านซ้าย */}
      <aside style={layoutStyles.sidebar}>
        {/* Brand Logo & Title */}
        <div style={layoutStyles.brand}>
          <div style={layoutStyles.logoContainer}>
            {!logoError ? (
              <img
                src="/logo/fire.png"
                alt="Logo"
                style={layoutStyles.logoImage}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div style={layoutStyles.logoFallback}>
                <Flame size={20} color="#f97316" />
              </div>
            )}
          </div>
          <div>
            <div style={layoutStyles.brandTitle}>FIRE & SMOKE</div>
            <div style={layoutStyles.brandSubtitle}>DETECTION SYSTEM FROM CCTV CAMERAS</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav style={layoutStyles.nav}>
          <div style={layoutStyles.navSectionHeader}>MAIN MENU</div>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active-link' : ''}`}
                style={{
                  ...layoutStyles.menuItem,
                  ...(isActive ? layoutStyles.activeMenuItem : {}),
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

        {/* Sidebar Footer: System Status Pill */}
        <div style={layoutStyles.sidebarFooter}>
          <div style={layoutStyles.systemStatusBox}>
            <div style={layoutStyles.systemStatusTop}>
              <span style={layoutStyles.statusDot} className="sidebar-pulse-dot" />
              <span style={layoutStyles.statusLabel}>SURVEILLANCE ACTIVE</span>
            </div>
            <div style={layoutStyles.statusSub}>AI Detection System v1.0</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={layoutStyles.mainContent}>
        {/* Top Header */}
        <header style={layoutStyles.header}>
          <div style={layoutStyles.headerLeft}>
            <span style={layoutStyles.headerCategory}>System</span>
            <span style={layoutStyles.headerDivider}>/</span>
            <span style={layoutStyles.headerPageName}>{currentPageTitle}</span>
          </div>

          <div style={layoutStyles.headerRight}>
            {/* User Profile Dropdown Button */}
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
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div style={layoutStyles.avatarFallback}>
                    <Shield size={16} color="#2563eb" />
                  </div>
                </div>
                <div style={layoutStyles.userInfoCol}>
                  <span style={layoutStyles.usernameText}>{username}</span>
                  <span
                    style={{
                      ...layoutStyles.roleBadgeMini,
                      backgroundColor: userRole?.toLowerCase() === 'admin' ? '#dbeafe' : '#f1f5f9',
                      color: userRole?.toLowerCase() === 'admin' ? '#1e40af' : '#475569',
                    }}
                  >
                    {userRole?.toUpperCase()}
                  </span>
                </div>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {/* Popover Menu */}
              {showProfileMenu && (
                <div style={layoutStyles.profileModal}>
                  <div style={layoutStyles.modalHeader}>
                    <div style={layoutStyles.largeAvatar}>
                      <Shield size={22} color="#2563eb" />
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
                    <LogOut size={14} />
                    <span>ออกจากระบบ</span>
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
    marginBottom: '32px',
    paddingLeft: '6px',
  },
  logoContainer: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '36px',
    height: '36px',
    objectFit: 'contain',
  },
  logoFallback: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '0.5px',
  },
  brandSubtitle: {
    fontSize: '9px',
    color: '#94a3b8',
    fontWeight: '600',
    letterSpacing: '0.3px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  navSectionHeader: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '1px',
    padding: '6px 12px',
    marginBottom: '4px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    borderRadius: '10px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '500',
  },
  activeMenuItem: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: '600',
    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)',
  },
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  systemStatusBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '10px 12px',
  },
  systemStatusTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
  },
  statusLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: '0.5px',
  },
  statusSub: {
    fontSize: '10px',
    color: '#64748b',
    marginTop: '2px',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
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
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerCategory: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  headerDivider: {
    fontSize: '13px',
    color: '#cbd5e1',
  },
  headerPageName: {
    fontSize: '14px',
    color: '#1e293b',
    fontWeight: '600',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  adminDropdownBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '10px',
    transition: 'all 0.15s',
  },
  smallAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '1px solid #bfdbfe',
  },
  avatarImage: {
    width: '20px',
    height: '20px',
    objectFit: 'contain',
  },
  avatarFallback: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfoCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
  },
  usernameText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: '1.2',
  },
  roleBadgeMini: {
    fontSize: '9px',
    fontWeight: '700',
    padding: '1px 5px',
    borderRadius: '4px',
    letterSpacing: '0.3px',
  },
  profileModal: {
    position: 'absolute',
    top: '52px',
    right: '0',
    width: '200px',
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
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
    borderRadius: '10px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #bfdbfe',
  },
  roleBadge: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalLogoutBtn: {
    width: '100%',
    padding: '9px',
    backgroundColor: '#fef2f2',
    color: '#ef4444',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.15s',
  },
  body: {
    padding: '32px 36px',
    flex: 1,
  },
};

export default MainLayout;