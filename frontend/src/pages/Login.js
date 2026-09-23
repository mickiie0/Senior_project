import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Flame,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import styles from './styles';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8080/auth/login', {
        email: email.trim(),
        password: password,
      });

      const token = response.data.token;

      localStorage.setItem('token', token);
      localStorage.setItem('login_time', new Date().toISOString());

      try {
        const meRes = await axios.get('http://localhost:8080/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        localStorage.setItem(
          'user_info',
          JSON.stringify({
            username: meRes.data.username,
            email: meRes.data.email,
            role: meRes.data.role,
            user_id: meRes.data.user_id,
          })
        );
      } catch (_) {}

      navigate('/dashboard');
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      } else {
        setError('ไม่สามารถเชื่อมต่อกับ Backend ได้');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        .login-input:focus {
          border-color: #2563eb !important;
          background-color: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
        }
        .login-btn:hover:not(:disabled) {
          background-color: #1d4ed8 !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35) !important;
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .login-link:hover {
          text-decoration: underline !important;
        }
      `}</style>

      <div style={styles.cardWrapper}>
        {/* Brand Section */}
        <div style={styles.brandSection}>
          <div style={styles.brandLogoWrap}>
            {!logoError ? (
              <img
                src="/logo/fire.png"
                alt="Fire & Smoke Detection System Logo"
                style={styles.brandLogoImg}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div style={styles.brandLogoFallback}>
                <Flame size={24} color="#f97316" />
              </div>
            )}
          </div>
          <div>
            <h2 style={styles.brandTitle}>FIRE & SMOKE</h2>
            <p style={styles.brandSubtitle}>DETECTION SYSTEM FROM CCTV CAMERAS</p>
          </div>
        </div>

        {/* Login Card */}
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>เข้าสู่ระบบ</h1>
            <p style={styles.subtitle}>กรุณากรอกข้อมูลเพื่อเข้าใช้งานระบบ</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>อีเมล</label>
              <div style={styles.inputWrapper}>
                <div style={styles.inputIcon}>
                  <Mail size={17} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="login-input"
                  style={styles.inputNoRight}
                  autoComplete="email"
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>รหัสผ่าน</label>
              <div style={styles.inputWrapper}>
                <div style={styles.inputIcon}>
                  <Lock size={17} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="login-input"
                  style={styles.input}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.togglePasswordBtn}
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <div style={{ textAlign: 'left', marginTop: '-6px' }}>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  className="login-link"
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-btn"
              style={{
                ...styles.button,
                opacity: loading ? 0.75 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div style={styles.footer}>
            <span style={{ color: '#64748b' }}>ยังไม่มีบัญชีผู้ใช้งาน? </span>
            <Link to="/register" style={styles.link} className="login-link">
              สมัครสมาชิก
            </Link>
          </div>
        </div>

        {/* System security footer note */}
        <div style={styles.systemFooter}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={14} color="#64748b" /> Object Detection System v1.0
          </span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 19, 41, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(5px)',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForgotModal(false);
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '30px 28px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <KeyRound size={24} color="#2563eb" />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              ลืมรหัสผ่าน?
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
              หากต้องการรีเซ็ตรหัสผ่าน กรุณาติดต่อ <strong>ผู้ดูแลระบบ (Admin)</strong> เพื่อดำเนินการตรวจสอบสิทธิ์และกำหนดรหัสผ่านใหม่
            </p>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="login-btn"
              style={{
                width: '100%',
                padding: '11px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              รับทราบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;