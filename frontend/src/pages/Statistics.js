import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';

const Statistics = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.get('http://localhost:8080/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (err) {
        localStorage.removeItem('token');
        navigate('/');
      }
    };

    fetchUserData();
  }, [navigate]);

  return (
    <MainLayout 
      title="Statistics" 
      username={user?.username || 'User'} 
      userRole={user?.role || 'user'}
    >
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>สถิติการแจ้งเตือน (Statistics)</h3>
        <p style={{ color: '#64748b', fontSize: '14px' }}>พื้นที่สำหรับแสดงกราฟและข้อมูลทางสถิติการตรวจจับ</p>
      </div>
    </MainLayout>
  );
};

export default Statistics;