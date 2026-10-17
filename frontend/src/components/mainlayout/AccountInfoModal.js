import React from 'react';
import { User, Mail, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import S from './MainLayoutStyles';
import { formatDateTimeThai } from './MainLayoutHelpers';

const AccountInfoModal = ({ username, userEmail, userRole, loginTime, onClose }) => {
  const isAdminRole = userRole?.toLowerCase() === 'admin';

  return (
    <div
      style={S.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={S.infoModal}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
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
          <button onClick={onClose} style={S.closeModalBtn} title="ปิด">
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
                  backgroundColor: isAdminRole ? '#dbeafe' : '#f1f5f9',
                  color: isAdminRole ? '#1d4ed8' : '#475569',
                }}
              >
                {isAdminRole ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่ทั่วไป (User)'}
              </span>
            </div>
          </div>

          <div style={S.infoRow}>
            <div style={S.infoLabelCol}>
              <CheckCircle2 size={14} color="#16a34a" />
              <span>สถานะบัญชี</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }}
              />
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
          <button onClick={onClose} style={S.infoCloseBtn}>
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountInfoModal;
