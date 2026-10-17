import React from 'react';
import { Shield, ChevronDown, User, KeyRound, ArrowLeftRight, LogOut } from 'lucide-react';
import S from './MainLayoutStyles';

const ProfileMenu = ({
  menuRef,
  isOpen,
  onToggle,
  username,
  userRole,
  userEmail,
  onOpenAccountInfo,
  onOpenChangePassword,
  onOpenSwitchAccount,
  onOpenLogout,
}) => {
  const isAdminRole = userRole?.toLowerCase() === 'admin';

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button onClick={onToggle} style={S.adminDropdownBtn}>
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
              backgroundColor: isAdminRole ? '#dbeafe' : '#f1f5f9',
              color: isAdminRole ? '#1e40af' : '#475569',
            }}
          >
            {userRole?.toUpperCase()}
          </span>
        </div>
        <ChevronDown size={14} color="#64748b" />
      </button>

      {isOpen && (
        <div style={S.profileModal}>
          <div style={S.modalHeader}>
            <div style={S.largeAvatar}>
              <Shield size={22} color="#2563eb" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>{username}</div>
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
                    backgroundColor: isAdminRole ? '#dbeafe' : '#f1f5f9',
                    color: isAdminRole ? '#1d4ed8' : '#475569',
                  }}
                >
                  {userRole?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '12px 0 8px 0' }} />

          <button onClick={onOpenAccountInfo} className="profile-menu-item">
            <User size={15} color="#475569" />
            <span>ข้อมูลบัญชี</span>
          </button>

          <button onClick={onOpenChangePassword} className="profile-menu-item">
            <KeyRound size={15} color="#475569" />
            <span>เปลี่ยนรหัสผ่าน</span>
          </button>

          <button onClick={onOpenSwitchAccount} className="profile-menu-item">
            <ArrowLeftRight size={15} color="#475569" />
            <span>สลับบัญชี</span>
          </button>

          <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '8px 0' }} />

          <button onClick={onOpenLogout} className="profile-menu-item profile-menu-logout">
            <LogOut size={15} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
