import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8080/auth/login', {
        email: email.trim(),
        password: password,
      });

      // เก็บ Token ที่ Backend ส่งกลับมา
      localStorage.setItem('token', response.data.token);

      // Login สำเร็จ
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
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>เข้าสู่ระบบ</h1>
          <p style={styles.subtitle}>ยินดีต้อนรับกลับมา! กรุณากรอกข้อมูลเพื่อเข้าใช้งาน</p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
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
              placeholder="••••••••"
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
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={{ color: '#64748b' }}>ยังไม่มีบัญชีใช่ไหม? </span>
          <Link to="/register" style={styles.link}>
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;