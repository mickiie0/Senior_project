import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Volume2,
  VolumeX,
  CheckCheck,
  Shield,
  Flame,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { formatThaiDateTime } from '../../utils/thaiDate';
import S from './MainLayoutStyles';
import { formatTimeAgoMini } from './MainLayoutHelpers';

const NotificationItem = ({ item, readEventIds, onClick }) => {
  const isF = (item.details || []).some((d) =>
    (d.detection_type || '').toLowerCase().includes('fire')
  );

  const isUnread = (() => {
    const lastRead = localStorage.getItem('last_read_notif_time');
    const alreadyReadById = readEventIds.has(String(item.event_id));
    if (alreadyReadById) return false;
    if (!lastRead) return true;
    return new Date(item.created_at).getTime() > new Date(lastRead).getTime();
  })();

  return (
    <div
      onClick={() => onClick(item, isUnread)}
      style={{
        ...S.notifItem,
        backgroundColor: isUnread ? '#fef9f9' : 'transparent',
      }}
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
          <span style={{ ...S.notifItemTitle, fontWeight: isUnread ? '700' : '500' }}>
            {isF ? 'ตรวจพบเปลวไฟ' : 'ตรวจพบกลุ่มควัน'}
          </span>
          <span style={S.notifItemTime} title={formatThaiDateTime(item.created_at)}>
            {formatTimeAgoMini(item.created_at)}
          </span>
        </div>
        <div style={S.notifItemSub}>
          กล้อง: <strong>{item.camera_id}</strong> • รหัส {item.event_id}
        </div>
      </div>
      {isUnread && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#dc2626',
            flexShrink: 0,
            alignSelf: 'center',
          }}
        />
      )}
    </div>
  );
};

const NotificationMenu = ({
  menuRef,
  isOpen,
  onToggle,
  onClose,
  notifications,
  unreadCount,
  readEventIds,
  isMuted,
  onToggleMute,
  onMarkAllAsRead,
  onMarkEventAsRead,
  onSelectEvent,
}) => {
  const handleItemClick = (item, isUnread) => {
    if (isUnread) onMarkEventAsRead(item.event_id);
    onClose();
    onSelectEvent(item);
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={onToggle}
        style={{
          ...S.bellBtn,
          backgroundColor: unreadCount > 0 ? '#fef2f2' : '#ffffff',
          borderColor: unreadCount > 0 ? '#fecaca' : '#e2e8f0',
        }}
        title="Notifications"
      >
        <Bell size={19} color={unreadCount > 0 ? '#dc2626' : '#64748b'} />
        {unreadCount > 0 && (
          <span style={S.bellBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div style={S.notifPopover}>
          <div style={S.notifHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>
                การแจ้งเตือน
              </span>
              {unreadCount > 0 && <span style={S.notifCountPill}>{unreadCount} ใหม่</span>}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
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
              onClick={onToggleMute}
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
              notifications.map((item) => (
                <NotificationItem
                  key={item.event_id}
                  item={item}
                  readEventIds={readEventIds}
                  onClick={handleItemClick}
                />
              ))
            )}
          </div>

          <div style={S.notifFooter}>
            <Link to="/events" onClick={onClose} style={S.viewAllLink}>
              <span>ดูประวัติเหตุการณ์ทั้งหมด</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationMenu;
