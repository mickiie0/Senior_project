import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import S from './MainLayoutStyles';

const SwitchAccountModal = ({ username, onCancel, onConfirm }) => {
  return (
    <div style={S.modalOverlay}>
      <div style={S.confirmModal}>
        <div style={S.switchIconWrap}>
          <ArrowLeftRight size={24} color="#2563eb" />
        </div>
        <div style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a', marginBottom: '8px' }}>
          สลับบัญชีผู้ใช้
        </div>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
          คุณต้องการออกจากบัญชีปัจจุบัน (<strong>{username}</strong>)
          <br />
          เพื่อเข้าสู่ระบบด้วยบัญชีอื่นใช่หรือไม่?
        </div>
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button onClick={onCancel} style={S.confirmCancelBtn}>
            ยกเลิก
          </button>
          <button onClick={onConfirm} style={S.switchConfirmBtn}>
            <ArrowLeftRight size={14} />
            <span>ยืนยันสลับบัญชี</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwitchAccountModal;
