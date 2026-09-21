import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  History,
  Video,
  Flame,
  LogOut,
  ChevronDown,
  Shield,
  Bell,
  Volume2,
  VolumeX,
  CheckCheck,
  AlertTriangle,
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff,
  User,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import audioAlert from '../../utils/audioAlert';
import {
  requestNotificationPermission,
  sendDesktopNotification,
} from '../../utils/browserNotification';

const API_URL = 'http://localhost:8080/api';

const hasFireOrSmoke = (event) => {
  if (!event) return false;
  if (Array.isArray(event.details)) {
    return event.details.some(
      (d) =>
        (d.detection_type || '').toLowerCase().includes('fire') ||
        (d.detection_type || '').toLowerCase().includes('smoke')
    );
  }
  return (
    (event.detection_type || '').toLowerCase().includes('fire') ||
    (event.detection_type || '').toLowerCase().includes('smoke')
  );
};

const formatTimeAgoMini = (dateString) => {
  if (!dateString) return '-';
  const diffSec = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (diffSec < 60) return 'เมื่อสักครู่';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ชม.ที่แล้ว`;
  return new Date(dateString).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateTimeThai = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '-';
  }
};

const getCachedUser = () => {
  try {
    const cached = localStorage.getItem('user_info');
    if (cached) return JSON.parse(cached);
  } catch (_) {}
  return null;
};

const MainLayout = ({ title, children, username: propUsername, userRole: propRole }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // User state initialised from cache so header doesn't flicker or show 'User'
  const [user, setUser] = useState(getCachedUser);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMuted, setIsMuted] = useState(audioAlert.isMuted());
  const [logoError, setLogoError] = useState(false);

  // Modals state
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSwitchAccountConfirm, setShowSwitchAccountConfirm] = useState(false);

  // Change Password state
  const [showChangePw, setShowChangePw] = useState(false);
  const [changePwForm, setChangePwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [changePwError, setChangePwError] = useState('');
  const [changePwSuccess, setChangePwSuccess] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const notifMenuRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Fetch and cache user info from /api/me
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    axios
      .get(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const info = {
          username: res.data.username,
          email: res.data.email,
          role: res.data.role,
          user_id: res.data.user_id,
        };
        setUser(info);
        localStorage.setItem('user_info', JSON.stringify(info));
        if (!localStorage.getItem('login_time')) {
          localStorage.setItem('login_time', new Date().toISOString());
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_info');
        navigate('/');
      });
  }, [navigate]);

  const username = user?.username || propUsername || 'User';
  const userRole = user?.role || propRole || 'user';
  const userEmail = user?.email || '';
  const loginTime = localStorage.getItem('login_time') || '';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('login_time');
    navigate('/');
  };

  const handleSwitchAccount = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('login_time');
    navigate('/');
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request desktop notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Fetch initial alerts
  const fetchInitialNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.get(`${API_URL}/detections`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const all = res.data || [];
      const alertEvents = all.filter(hasFireOrSmoke);
      setNotifications(alertEvents.slice(0, 15));

      const lastRead = localStorage.getItem('last_read_notif_time');
      if (!lastRead) {
        setUnreadCount(alertEvents.length);
      } else {
        const lastReadTime = new Date(lastRead).getTime();
        const unread = alertEvents.filter(
          (e) => new Date(e.created_at).getTime() > lastReadTime
        ).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchInitialNotifications();
  }, [fetchInitialNotifications]);

  // Global SSE listener for notifications
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let eventSource = null;
    try {
      const sseUrl = `${API_URL}/events/stream?token=${encodeURIComponent(token)}`;
      eventSource = new EventSource(sseUrl);

      eventSource.addEventListener('new_detection', (e) => {
        try {
          const newEvent = JSON.parse(e.data);
          if (newEvent?.event_id && hasFireOrSmoke(newEvent)) {
            setNotifications((prev) => {
              if (prev.some((x) => x.event_id === newEvent.event_id)) return prev;
              return [newEvent, ...prev.slice(0, 14)];
            });
            setUnreadCount((prev) => prev + 1);

            audioAlert.playFireAlert(4);

            sendDesktopNotification({
              title: '🚨 ตรวจพบสัญญาณเพลิงไหม้ฉุกเฉิน!',
              body: `ตรวจพบที่กล้อง ${newEvent.camera_id} กรุณาตรวจสอบทันที`,
              icon: '/logo/fire.png',
              tag: newEvent.event_id,
              onClick: () => {
                navigate('/dashboard');
              },
            });
          }
        } catch (err) {
          console.error('Error handling SSE in MainLayout:', err);
        }
      });
    } catch (err) {
      // silent
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [navigate]);

  const handleMarkAllAsRead = () => {
    localStorage.setItem('last_read_notif_time', new Date().toISOString());
    setUnreadCount(0);
  };

  const handleToggleMute = () => {
    const next = audioAlert.toggleMute();
    setIsMuted(next);
  };

  const openAccountInfo = () => {
    setShowProfileMenu(false);
    setShowAccountInfo(true);
  };

  const openChangePw = () => {
    setShowProfileMenu(false);
    setChangePwForm({ current_password: '', new_password: '', confirm_password: '' });
    setChangePwError('');
    setChangePwSuccess('');
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
    setShowChangePw(true);
  };

  const handleChangePwSubmit = async (e) => {
    e.preventDefault();
    setChangePwError('');
    setChangePwSuccess('');

    if (changePwForm.new_password !== changePwForm.confirm_password) {
      setChangePwError('รหัสผ่านใหม่ และ ยืนยันรหัสผ่าน ไม่ตรงกัน');
      return;
    }
    if (changePwForm.new_password.length < 6) {
      setChangePwError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setChangePwLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/me/change-password`,
        {
          current_password: changePwForm.current_password,
          new_password: changePwForm.new_password,
          confirm_password: changePwForm.confirm_password,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChangePwSuccess('เปลี่ยนรหัสผ่านสำเร็จ! กำลังนำคุณออกจากระบบเพื่อเข้าสู่ระบบใหม่...');
      setTimeout(() => {
        handleLogout();
      }, 2000);
    } catch (err) {
      setChangePwError(
        err.response?.data?.error || 'เกิดข้อผิดพลาด ไม่สามารถเปลี่ยนรหัสผ่านได้'
      );
    } finally {
      setChangePwLoading(false);
    }
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
    <div style={S.container}>
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

      {/* Sidebar */}
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
            const isActive = location.pathname === item.path;
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
            <div style={S.statusSub}>AI Detection System v1.0</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={S.mainContent}>
        <header style={S.header}>
          <div style={S.headerLeft}>
            <span style={S.headerCategory}>System</span>
            <span style={S.headerDivider}>/</span>
            <span style={S.headerPageName}>{currentPageTitle}</span>
          </div>

          <div style={S.headerRight}>
            {/* Notification Bell Button & Popover */}
            <div style={{ position: 'relative' }} ref={notifMenuRef}>
              <button
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  setShowProfileMenu(false);
                }}
                style={{
                  ...S.bellBtn,
                  backgroundColor: unreadCount > 0 ? '#fef2f2' : '#ffffff',
                  borderColor: unreadCount > 0 ? '#fecaca' : '#e2e8f0',
                }}
                title="ศูนย์การแจ้งเตือนเหตุการณ์ฉุกเฉิน"
              >
                <Bell
                  size={19}
                  color={unreadCount > 0 ? '#dc2626' : '#64748b'}
                />
                {unreadCount > 0 && (
                  <span style={S.bellBadge}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div style={S.notifPopover}>
                  <div style={S.notifHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>
                        การแจ้งเตือน
                      </span>
                      {unreadCount > 0 && (
                        <span style={S.notifCountPill}>
                          {unreadCount} ใหม่
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        style={S.markAllReadBtn}
                        title="ทำเครื่องหมายว่าอ่านแล้วทั้งหมด"
                      >
                        <CheckCheck size={14} />
                        <span>อ่านทั้งหมด</span>
                      </button>
                    )}
                  </div>

                  <div style={S.soundBar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isMuted ? (
                        <VolumeX size={15} color="#ef4444" />
                      ) : (
                        <Volume2 size={15} color="#16a34a" />
                      )}
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                        เสียงสัญญาณเตือนภัย: <strong>{isMuted ? 'ปิดเสียง' : 'เปิดเสียง'}</strong>
                      </span>
                    </div>
                    <button
                      onClick={handleToggleMute}
                      style={{
                        ...S.soundToggleBtn,
                        backgroundColor: isMuted ? '#fee2e2' : '#dcfce7',
                        color: isMuted ? '#b91c1c' : '#15803d',
                      }}
                    >
                      {isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
                    </button>
                  </div>

                  <div style={S.notifList}>
                    {notifications.length === 0 ? (
                      <div style={S.notifEmpty}>
                        <Shield size={28} color="#94a3b8" />
                        <span style={{ marginTop: '8px', fontSize: '13px', color: '#64748b' }}>
                          ยังไม่มีเหตุการณ์แจ้งเตือน
                        </span>
                      </div>
                    ) : (
                      notifications.map((item) => {
                        const isF = (item.details || []).some((d) =>
                          (d.detection_type || '').toLowerCase().includes('fire')
                        );
                        return (
                          <div
                            key={item.event_id}
                            onClick={() => {
                              setShowNotifMenu(false);
                              navigate('/dashboard');
                            }}
                            style={S.notifItem}
                          >
                            <div
                              style={{
                                ...S.notifIconWrap,
                                backgroundColor: isF ? '#fef2f2' : '#fffbeb',
                                color: isF ? '#dc2626' : '#d97706',
                              }}
                            >
                              {isF ? <Flame size={16} /> : <AlertTriangle size={16} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={S.notifItemTop}>
                                <span style={S.notifItemTitle}>
                                  {isF ? 'ตรวจพบเปลวไฟ' : 'ตรวจพบกลุ่มควัน'}
                                </span>
                                <span style={S.notifItemTime}>
                                  {formatTimeAgoMini(item.created_at)}
                                </span>
                              </div>
                              <div style={S.notifItemSub}>
                                กล้อง: <strong>{item.camera_id}</strong> • รหัส {item.event_id}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div style={S.notifFooter}>
                    <Link
                      to="/events"
                      onClick={() => setShowNotifMenu(false)}
                      style={S.viewAllLink}
                    >
                      <span>ดูประวัติเหตุการณ์ทั้งหมด</span>
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown Button */}
            <div style={{ position: 'relative' }} ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={S.adminDropdownBtn}
              >
                <div style={S.smallAvatar}>
                  <img
                    src="/logo/user.png"
                    alt="User Profile"
                    style={S.avatarImage}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div style={S.avatarFallback}>
                    <Shield size={16} color="#2563eb" />
                  </div>
                </div>
                <div style={S.userInfoCol}>
                  <span style={S.usernameText}>{username}</span>
                  <span
                    style={{
                      ...S.roleBadgeMini,
                      backgroundColor: userRole?.toLowerCase() === 'admin' ? '#dbeafe' : '#f1f5f9',
                      color: userRole?.toLowerCase() === 'admin' ? '#1e40af' : '#475569',
                    }}
                  >
                    {userRole?.toUpperCase()}
                  </span>
                </div>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {/* Profile Dropdown Popover */}
              {showProfileMenu && (
                <div style={S.profileModal}>
                  {/* User Profile Header */}
                  <div style={S.modalHeader}>
                    <div style={S.largeAvatar}>
                      <Shield size={22} color="#2563eb" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                        {username}
                      </div>
                      {/* Email display in subtle gray text */}
                      {userEmail && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#94a3b8',
                            marginTop: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={userEmail}
                        >
                          {userEmail}
                        </div>
                      )}
                      <div style={{ marginTop: '4px' }}>
                        <span
                          style={{
                            ...S.roleBadge,
                            backgroundColor: userRole?.toLowerCase() === 'admin' ? '#dbeafe' : '#f1f5f9',
                            color: userRole?.toLowerCase() === 'admin' ? '#1d4ed8' : '#475569',
                          }}
                        >
                          {userRole?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '12px 0 8px 0' }} />

                  {/* Menu Item 1: ข้อมูลบัญชี (Account Info) */}
                  <button
                    onClick={openAccountInfo}
                    className="profile-menu-item"
                  >
                    <User size={15} color="#475569" />
                    <span>ข้อมูลบัญชี</span>
                  </button>

                  {/* Menu Item 2: เปลี่ยนรหัสผ่าน (Change Password) */}
                  <button
                    onClick={openChangePw}
                    className="profile-menu-item"
                  >
                    <KeyRound size={15} color="#475569" />
                    <span>เปลี่ยนรหัสผ่าน</span>
                  </button>

                  {/* Menu Item 3: สลับบัญชี (Switch Account) */}
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowSwitchAccountConfirm(true);
                    }}
                    className="profile-menu-item"
                  >
                    <ArrowLeftRight size={15} color="#475569" />
                    <span>สลับบัญชี</span>
                  </button>

                  <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '8px 0' }} />

                  {/* Menu Item 4: ออกจากระบบ (Logout) */}
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="profile-menu-item profile-menu-logout"
                  >
                    <LogOut size={15} />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main style={S.body}>{children}</main>
      </div>

      {/* ─── Modal 1: ข้อมูลบัญชี (Account Info Modal) ─────────────────────────── */}
      {showAccountInfo && (
        <div
          style={S.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAccountInfo(false);
          }}
        >
          <div style={S.infoModal}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={S.infoIconWrap}>
                  <User size={20} color="#2563eb" />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>
                    ข้อมูลบัญชีผู้ใช้งาน
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    รายละเอียดบัญชีและการเข้าสู่ระบบ
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAccountInfo(false)}
                style={S.closeModalBtn}
                title="ปิด"
              >
                ✕
              </button>
            </div>

            <div style={S.infoList}>
              <div style={S.infoRow}>
                <div style={S.infoLabelCol}>
                  <User size={14} color="#64748b" />
                  <span>ชื่อผู้ใช้งาน</span>
                </div>
                <div style={S.infoValueText}>{username}</div>
              </div>

              <div style={S.infoRow}>
                <div style={S.infoLabelCol}>
                  <Mail size={14} color="#64748b" />
                  <span>อีเมล</span>
                </div>
                <div style={S.infoValueText}>{userEmail || '-'}</div>
              </div>

              <div style={S.infoRow}>
                <div style={S.infoLabelCol}>
                  <ShieldCheck size={14} color="#64748b" />
                  <span>บทบาท / สิทธิ์</span>
                </div>
                <div>
                  <span
                    style={{
                      ...S.roleBadge,
                      backgroundColor: userRole?.toLowerCase() === 'admin' ? '#dbeafe' : '#f1f5f9',
                      color: userRole?.toLowerCase() === 'admin' ? '#1d4ed8' : '#475569',
                    }}
                  >
                    {userRole?.toLowerCase() === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่ทั่วไป (User)'}
                  </span>
                </div>
              </div>

              <div style={S.infoRow}>
                <div style={S.infoLabelCol}>
                  <CheckCircle2 size={14} color="#16a34a" />
                  <span>สถานะบัญชี</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#16a34a' }}>
                    กำลังใช้งาน (Active)
                  </span>
                </div>
              </div>

              <div style={S.infoRow}>
                <div style={S.infoLabelCol}>
                  <Clock size={14} color="#64748b" />
                  <span>เวลาเข้าใช้งานรอบนี้</span>
                </div>
                <div style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                  {formatDateTimeThai(loginTime)}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAccountInfo(false)}
                style={S.infoCloseBtn}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: เปลี่ยนรหัสผ่าน (Change Password Modal) ──────────────────── */}
      {showChangePw && (
        <div
          style={S.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowChangePw(false);
          }}
        >
          <div style={S.changePwModal}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={S.changePwIconWrap}>
                  <KeyRound size={18} color="#2563eb" />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>
                    เปลี่ยนรหัสผ่าน
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowChangePw(false)}
                style={S.closeModalBtn}
                title="ปิด"
              >
                ✕
              </button>
            </div>

            {changePwError && (
              <div style={S.changePwErrorBox}>
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>{changePwError}</span>
              </div>
            )}
            {changePwSuccess && (
              <div style={S.changePwSuccessBox}>
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{changePwSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePwSubmit}>
              <div style={S.changePwField}>
                <label style={S.changePwLabel}>รหัสผ่านปัจจุบัน</label>
                <div className="pw-wrap">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={changePwForm.current_password}
                    onChange={(e) =>
                      setChangePwForm({ ...changePwForm, current_password: e.target.value })
                    }
                    placeholder="กรอกรหัสผ่านปัจจุบัน"
                    style={S.changePwInput}
                    disabled={!!changePwSuccess}
                  />
                  <button
                    type="button"
                    className="pw-eye"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    tabIndex={-1}
                  >
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={S.changePwField}>
                <label style={S.changePwLabel}>รหัสผ่านใหม่</label>
                <div className="pw-wrap">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    value={changePwForm.new_password}
                    onChange={(e) =>
                      setChangePwForm({ ...changePwForm, new_password: e.target.value })
                    }
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    style={S.changePwInput}
                    disabled={!!changePwSuccess}
                  />
                  <button
                    type="button"
                    className="pw-eye"
                    onClick={() => setShowNewPw(!showNewPw)}
                    tabIndex={-1}
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={S.changePwField}>
                <label style={S.changePwLabel}>ยืนยันรหัสผ่านใหม่</label>
                <div className="pw-wrap">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    required
                    value={changePwForm.confirm_password}
                    onChange={(e) =>
                      setChangePwForm({ ...changePwForm, confirm_password: e.target.value })
                    }
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    style={S.changePwInput}
                    disabled={!!changePwSuccess}
                  />
                  <button
                    type="button"
                    className="pw-eye"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    tabIndex={-1}
                  >
                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
                <button
                  type="button"
                  onClick={() => setShowChangePw(false)}
                  style={S.confirmCancelBtn}
                  disabled={changePwLoading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  style={{
                    ...S.changePwSubmitBtn,
                    opacity: changePwLoading || changePwSuccess ? 0.7 : 1,
                    cursor: changePwLoading || changePwSuccess ? 'not-allowed' : 'pointer',
                  }}
                  disabled={changePwLoading || !!changePwSuccess}
                >
                  {changePwLoading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 3: สลับบัญชี (Switch Account Confirm Modal) ─────────────────── */}
      {showSwitchAccountConfirm && (
        <div style={S.modalOverlay}>
          <div style={S.confirmModal}>
            <div style={S.switchIconWrap}>
              <ArrowLeftRight size={24} color="#2563eb" />
            </div>
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a', marginBottom: '8px' }}>
              สลับบัญชีผู้ใช้
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
              คุณต้องการออกจากบัญชีปัจจุบัน (<strong>{username}</strong>)<br />
              เพื่อเข้าสู่ระบบด้วยบัญชีอื่นใช่หรือไม่?
            </div>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button
                onClick={() => setShowSwitchAccountConfirm(false)}
                style={S.confirmCancelBtn}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSwitchAccount}
                style={S.switchConfirmBtn}
              >
                <ArrowLeftRight size={14} />
                <span>ยืนยันสลับบัญชี</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 4: ยืนยันออกจากระบบ (Logout Confirm Modal) ───────────────────── */}
      {showLogoutConfirm && (
        <div style={S.modalOverlay}>
          <div style={S.confirmModal}>
            <div style={S.confirmIconWrap}>
              <LogOut size={24} color="#ef4444" />
            </div>
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a', marginBottom: '8px' }}>
              ยืนยันออกจากระบบ
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
              คุณต้องการออกจากระบบใช่หรือไม่?<br />
              การเชื่อมต่อสัญญาณแจ้งเตือนเหตุการณ์เพลิงไหม้จะหยุดลง
            </div>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={S.confirmCancelBtn}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleLogout}
                style={S.confirmLogoutBtn}
              >
                <LogOut size={14} />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const S = {
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  systemStatusTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
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
    lineHeight: '1',
  },
  statusSub: {
    fontSize: '10px',
    color: '#64748b',
    marginTop: '2px',
    paddingLeft: '15px',
    lineHeight: '1',
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
    width: '230px',
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    padding: '16px',
    zIndex: 1000,
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'flex-start',
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
    flexShrink: 0,
  },
  roleBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bellBtn: {
    position: 'relative',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  bellBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '700',
    minWidth: '18px',
    height: '18px',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
    border: '2px solid #ffffff',
    lineHeight: '1',
  },
  notifPopover: {
    position: 'absolute',
    top: '52px',
    right: '0',
    width: '360px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    zIndex: 1000,
  },
  notifHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#ffffff',
  },
  notifCountPill: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '9999px',
    border: '1px solid #fecaca',
  },
  markAllReadBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'background 0.15s',
  },
  soundBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 18px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #f1f5f9',
  },
  soundToggleBtn: {
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  notifList: {
    maxHeight: '340px',
    overflowY: 'auto',
    padding: '6px 0',
  },
  notifEmpty: {
    padding: '36px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 18px',
    borderBottom: '1px solid #f8fafc',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  notifIconWrap: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  },
  notifItemTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '2px',
  },
  notifItemTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0f172a',
  },
  notifItemTime: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  notifItemSub: {
    fontSize: '12px',
    color: '#64748b',
    lineHeight: '1.4',
  },
  notifFooter: {
    padding: '10px 18px',
    borderTop: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
    textAlign: 'center',
  },
  viewAllLink: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#2563eb',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
  },
  body: {
    padding: '32px 36px',
    flex: 1,
  },
  // Modal Overlay
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    backdropFilter: 'blur(3px)',
  },
  closeModalBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: '18px',
    lineHeight: '1',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 0.15s',
  },
  // Account Info Modal
  infoModal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '28px',
    width: '420px',
    maxWidth: '92vw',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  infoIconWrap: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '16px 18px',
    border: '1px solid #e2e8f0',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '12px',
    borderBottom: '1px solid #edf2f7',
  },
  infoLabelCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
  },
  infoValueText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f172a',
  },
  infoCloseBtn: {
    padding: '9px 24px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  // Change Password Modal
  changePwModal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '28px',
    width: '410px',
    maxWidth: '92vw',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  changePwIconWrap: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  changePwField: {
    marginBottom: '14px',
  },
  changePwLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '6px',
  },
  changePwInput: {
    width: '100%',
    padding: '11px 14px',
    fontSize: '14px',
    borderRadius: '9px',
    border: '1px solid #cbd5e1',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#0f172a',
    backgroundColor: '#fff',
    transition: 'border-color 0.2s',
  },
  changePwErrorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    borderRadius: '9px',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '16px',
  },
  changePwSuccessBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#16a34a',
    borderRadius: '9px',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '16px',
  },
  changePwSubmitBtn: {
    flex: 2,
    padding: '11px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9px',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.15s',
  },
  // Confirm Modals (Logout / Switch Account)
  confirmModal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px 28px',
    width: '350px',
    maxWidth: '92vw',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  confirmIconWrap: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  switchIconWrap: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  confirmCancelBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: '9px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  confirmLogoutBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.15s',
  },
  switchConfirmBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.15s',
  },
};

export default MainLayout;
