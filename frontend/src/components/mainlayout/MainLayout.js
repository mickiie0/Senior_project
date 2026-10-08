import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, History, Video, MessageSquare, Camera } from 'lucide-react';
import audioAlert from '../../utils/audioAlert';
import {
  requestNotificationPermission,
  sendDesktopNotification,
} from '../../utils/browserNotification';
import EventDetailModal from '../dashboard/EventDetailModal';

import S from './MainLayoutStyles';
import {
  API_URL,
  hasFireOrSmoke,
  getCachedUser,
  getStoredReadIds,
} from './MainLayoutHelpers';
import MainLayoutGlobalStyles from './MainLayoutGlobalStyles';
import Sidebar from './Sidebar';
import NotificationMenu from './NotificationMenu';
import ProfileMenu from './ProfileMenu';
import AccountInfoModal from './AccountInfoModal';
import ChangePasswordModal from './ChangePasswordModal';
import SwitchAccountModal from './SwitchAccountModal';
import LogoutConfirmModal from './LogoutConfirmModal';

const allMenuItems = [
  { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { path: '/events', name: 'Event History', icon: History, adminOnly: false },
  { path: '/snapshots', name: 'Snapshots', icon: Camera, adminOnly: true },
  { path: '/cameras', name: 'Camera Management', icon: Video, adminOnly: true },
  { path: '/discord', name: 'Discord Community', icon: MessageSquare, adminOnly: false },
];

const MainLayout = ({ title, children, username: propUsername, userRole: propRole }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(getCachedUser);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readEventIds, setReadEventIds] = useState(getStoredReadIds);
  const [isMuted, setIsMuted] = useState(audioAlert.isMuted());

  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSwitchAccountConfirm, setShowSwitchAccountConfirm] = useState(false);

  const [selectedNotifEvent, setSelectedNotifEvent] = useState(null);
  const [camerasMap, setCamerasMap] = useState({});

  const notifMenuRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios
      .get(`${API_URL}/cameras`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const map = {};
        (res.data || []).forEach((c) => {
          map[c.camera_id] = c;
        });
        setCamerasMap(map);
      })
      .catch(() => {});
  }, []);

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

  // Switching account clears the same session data as logging out
  const handleSwitchAccount = handleLogout;

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

  useEffect(() => {
    requestNotificationPermission();
  }, []);

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
      const storedIds = getStoredReadIds();

      if (!lastRead) {
        const unread = alertEvents.filter((e) => !storedIds.has(String(e.event_id))).length;
        setUnreadCount(unread);
      } else {
        const lastReadTime = new Date(lastRead).getTime();
        const unread = alertEvents.filter(
          (e) =>
            new Date(e.created_at).getTime() > lastReadTime &&
            !storedIds.has(String(e.event_id))
        ).length;
        setUnreadCount(unread);
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    fetchInitialNotifications();
  }, [fetchInitialNotifications]);

  const handleMarkEventAsRead = useCallback((eventId) => {
    const id = String(eventId);
    setReadEventIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('read_notif_ids', JSON.stringify([...next]));
      } catch (_) {}
      return next;
    });
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

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
              title: '🚨 ตรวจพบสัญญาณเพลิงไหม้!',
              body: `ตรวจพบที่กล้อง ${newEvent.camera_id} กรุณาตรวจสอบ`,
              icon: '/logo/fire.png',
              tag: newEvent.event_id,
              onClick: () => {
                try {
                  window.focus();
                } catch (e) {}
                setSelectedNotifEvent(newEvent);
              },
            });
          }
        } catch (err) {
          console.error('Error handling SSE in MainLayout:', err);
        }
      });
    } catch (err) {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [navigate]);

  const handleMarkAllAsRead = () => {
    localStorage.setItem('last_read_notif_time', new Date().toISOString());
    localStorage.removeItem('read_notif_ids');
    setReadEventIds(new Set());
    setUnreadCount(0);
  };

  const handleToggleMute = () => {
    const next = audioAlert.toggleMute();
    setIsMuted(next);
  };

  const menuItems = allMenuItems.filter(
    (item) => !(item.adminOnly && userRole?.toLowerCase() !== 'admin')
  );

  const currentPageTitle =
    title || allMenuItems.find((m) => m.path === location.pathname)?.name || 'Surveillance System';

  return (
    <div style={S.container}>
      <MainLayoutGlobalStyles />

      <Sidebar menuItems={menuItems} currentPath={location.pathname} />

      <div style={S.mainContent}>
        <header style={S.header}>
          <div style={S.headerLeft}>
            <span style={S.headerCategory}>System</span>
            <span style={S.headerDivider}>/</span>
            <span style={S.headerPageName}>{currentPageTitle}</span>
          </div>

          <div style={S.headerRight}>
            <NotificationMenu
              menuRef={notifMenuRef}
              isOpen={showNotifMenu}
              onToggle={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowProfileMenu(false);
              }}
              onClose={() => setShowNotifMenu(false)}
              notifications={notifications}
              unreadCount={unreadCount}
              readEventIds={readEventIds}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onMarkAllAsRead={handleMarkAllAsRead}
              onMarkEventAsRead={handleMarkEventAsRead}
              onSelectEvent={setSelectedNotifEvent}
            />

            <ProfileMenu
              menuRef={profileMenuRef}
              isOpen={showProfileMenu}
              onToggle={() => setShowProfileMenu(!showProfileMenu)}
              username={username}
              userRole={userRole}
              userEmail={userEmail}
              onOpenAccountInfo={() => {
                setShowProfileMenu(false);
                setShowAccountInfo(true);
              }}
              onOpenChangePassword={() => {
                setShowProfileMenu(false);
                setShowChangePw(true);
              }}
              onOpenSwitchAccount={() => {
                setShowProfileMenu(false);
                setShowSwitchAccountConfirm(true);
              }}
              onOpenLogout={() => {
                setShowProfileMenu(false);
                setShowLogoutConfirm(true);
              }}
            />
          </div>
        </header>

        <main style={S.body}>{children}</main>
      </div>

      {showAccountInfo && (
        <AccountInfoModal
          username={username}
          userEmail={userEmail}
          userRole={userRole}
          loginTime={loginTime}
          onClose={() => setShowAccountInfo(false)}
        />
      )}

      {showChangePw && (
        <ChangePasswordModal onClose={() => setShowChangePw(false)} onLogout={handleLogout} />
      )}

      {showSwitchAccountConfirm && (
        <SwitchAccountModal
          username={username}
          onCancel={() => setShowSwitchAccountConfirm(false)}
          onConfirm={handleSwitchAccount}
        />
      )}

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
        />
      )}

      {selectedNotifEvent && (
        <EventDetailModal
          selectedEvent={selectedNotifEvent}
          camerasMap={camerasMap}
          onClose={() => setSelectedNotifEvent(null)}
          isAdmin={user?.role?.toLowerCase() === 'admin'}
        />
      )}
    </div>
  );
};

export default MainLayout;
