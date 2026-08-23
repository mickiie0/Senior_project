import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles';

const Register = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation ความยาวข้อความให้ตรงกับ Backend
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

      alert('สมัครสมาชิกสำเร็จ!');
      navigate('/');
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
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>สมัครสมาชิก</h1>
          <p style={styles.subtitle}>สร้างบัญชีเพื่อเริ่มต้นใช้งานระบบ</p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>ชื่อผู้ใช้งาน</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="อย่างน้อย 3 ตัวอักษร"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>อีเมล</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>รหัสผ่าน</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={{ color: '#64748b' }}>มีบัญชีอยู่แล้วใช่ไหม? </span>
          <Link to="/" style={styles.link}>
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;