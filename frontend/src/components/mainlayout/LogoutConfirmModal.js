import React from 'react';
import { LogOut } from 'lucide-react';
import S from './MainLayoutStyles';

const LogoutConfirmModal = ({ onCancel, onConfirm }) => {
  return (
    <div style={S.modalOverlay}>
      <div style={S.confirmModal}>
        <div style={S.confirmIconWrap}>
          <LogOut size={24} color="#ef4444" />
        </div>
        <div style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a', marginBottom: '8px' }}>
          ยืนยันออกจากระบบ
        </div>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
          คุณต้องการออกจากระบบใช่หรือไม่?
          <br />
          การเชื่อมต่อสัญญาณแจ้งเตือนเหตุการณ์เพลิงไหม้จะหยุดลง
        </div>
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button onClick={onCancel} style={S.confirmCancelBtn}>
            ยกเลิก
          </button>
          <button onClick={onConfirm} style={S.confirmLogoutBtn}>
            <LogOut size={14} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
