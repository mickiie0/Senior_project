import React, { useState } from 'react';
import axios from 'axios';
import { KeyRound, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import S from './MainLayoutStyles';
import { API_URL } from './MainLayoutHelpers';

const PasswordField = ({ label, value, onChange, placeholder, disabled }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div style={S.changePwField}>
      <label style={S.changePwLabel}>{label}</label>
      <div className="pw-wrap">
        <input
          type={visible ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={S.changePwInput}
          disabled={disabled}
        />
        <button
          type="button"
          className="pw-eye"
          onClick={() => setVisible(!visible)}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
};

const ChangePasswordModal = ({ onClose, onLogout }) => {
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.new_password !== form.confirm_password) {
      setError('รหัสผ่านใหม่ และ ยืนยันรหัสผ่าน ไม่ตรงกัน');
      return;
    }
    if (form.new_password.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/me/change-password`,
        {
          current_password: form.current_password,
          new_password: form.new_password,
          confirm_password: form.confirm_password,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('เปลี่ยนรหัสผ่านสำเร็จ! กำลังนำคุณออกจากระบบเพื่อเข้าสู่ระบบใหม่...');
      setTimeout(() => {
        onLogout();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด ไม่สามารถเปลี่ยนรหัสผ่านได้');
    } finally {
      setLoading(false);
    }
  };

  const locked = loading || !!success;

  return (
    <div
      style={S.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={S.changePwModal}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
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
          <button onClick={onClose} style={S.closeModalBtn} title="ปิด">
            ✕
          </button>
        </div>

        {error && (
          <div style={S.changePwErrorBox}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div style={S.changePwSuccessBox}>
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <PasswordField
            label="รหัสผ่านปัจจุบัน"
            value={form.current_password}
            onChange={(v) => setForm({ ...form, current_password: v })}
            placeholder="กรอกรหัสผ่านปัจจุบัน"
            disabled={!!success}
          />

          <PasswordField
            label="รหัสผ่านใหม่"
            value={form.new_password}
            onChange={(v) => setForm({ ...form, new_password: v })}
            placeholder="อย่างน้อย 6 ตัวอักษร"
            disabled={!!success}
          />

          <PasswordField
            label="ยืนยันรหัสผ่านใหม่"
            value={form.confirm_password}
            onChange={(v) => setForm({ ...form, confirm_password: v })}
            placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
            disabled={!!success}
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
            <button
              type="button"
              onClick={onClose}
              style={S.confirmCancelBtn}
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              style={{
                ...S.changePwSubmitBtn,
                opacity: locked ? 0.7 : 1,
                cursor: locked ? 'not-allowed' : 'pointer',
              }}
              disabled={locked}
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
