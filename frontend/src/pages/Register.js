import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Flame,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import styles from './styles';

const Register = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let timer;
    if (success) {
      timer = setTimeout(() => {
        navigate('/');
      }, 2500);
    }
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (username.trim().length < 3) {
      setError('ชื่อผู้ใช้งานต้องมีอย่างน้อย 3 ตัวอักษร');
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่าน และ ยืนยันรหัสผ่าน ไม่ตรงกัน');
      return;
    }

    setLoading(true);

    try {
      await axios.post('http://localhost:8080/auth/register', {
        username: username.trim(),
        email: email.trim(),
        password: password,
      });

      setSuccess(true);
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.error || 'สมัครสมาชิกไม่สำเร็จ');
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
        .register-input:focus {
          border-color: #2563eb !important;
          background-color: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
        }
        .register-btn:hover:not(:disabled) {
          background-color: #1d4ed8 !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35) !important;
        }
        .register-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .register-link:hover {
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

        {/* Register Card */}
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>สมัครสมาชิก</h1>
            <p style={styles.subtitle}>สร้างบัญชีเพื่อเริ่มต้นเข้าใช้งานระบบ</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>ชื่อผู้ใช้งาน</label>
              <div style={styles.inputWrapper}>
                <div style={styles.inputIcon}>
                  <User size={17} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="อย่างน้อย 3 ตัวอักษร"
                  className="register-input"
                  style={styles.inputNoRight}
                  autoComplete="username"
                />
              </div>
            </div>

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
                  className="register-input"
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
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className="register-input"
                  style={styles.input}
                  autoComplete="new-password"
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
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>ยืนยันรหัสผ่าน</label>
              <div style={styles.inputWrapper}>
                <div style={styles.inputIcon}>
                  <ShieldCheck size={17} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  className="register-input"
                  style={styles.input}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.togglePasswordBtn}
                  title={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="register-btn"
              style={{
                ...styles.button,
                opacity: loading ? 0.75 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <span>{loading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก'}</span>
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div style={styles.footer}>
            <span style={{ color: '#64748b' }}>มีบัญชีผู้ใช้งานอยู่แล้ว? </span>
            <Link to="/" style={styles.link} className="register-link">
              เข้าสู่ระบบ
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

      {/* Success Modal */}
      {success && (
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
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '32px 28px',
              width: '100%',
              maxWidth: '380px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <CheckCircle2 size={32} color="#16a34a" />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '19px', fontWeight: '700', color: '#0f172a' }}>
              สมัครสมาชิกสำเร็จ!
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
              บัญชีผู้ใช้งานของคุณถูกสร้างเรียบร้อยแล้ว<br />
              ระบบกำลังนำท่านไปยังหน้าเข้าสู่ระบบอัตโนมัติ...
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="register-btn"
              style={{
                width: '100%',
                padding: '12px',
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
              เข้าสู่ระบบทันที
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;