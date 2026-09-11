import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';

const API_BASE_URL = 'http://localhost:8080/api';
const POLL_INTERVAL_MS = 5000;
const ACTIVE_CAMERA_STATUS = 'active';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

const isCameraOnline = (cam) => cam.is_active === true || cam.status === ACTIVE_CAMERA_STATUS;

const isAuthError = (result) =>
  result.status === 'rejected' && result.reason?.response?.status === 401;

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('token');
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/me`, getAuthHeaders());
        if (isMountedRef.current) setUser(response.data);
      } catch (err) {
        handleSessionExpired();
      }
    };

    fetchUserData();
  }, [navigate, handleSessionExpired]);

  const fetchDashboardData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const [camRes, detectRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/cameras`, getAuthHeaders()),
        axios.get(`${API_BASE_URL}/detections/recent-detections`, getAuthHeaders()),
      ]);

      if (isAuthError(camRes) || isAuthError(detectRes)) {
        handleSessionExpired();
        return;
      }

      if (!isMountedRef.current) return;

      if (camRes.status === 'fulfilled') {
        setCameras(camRes.value.data || []);
      }
      if (detectRes.status === 'fulfilled') {
        setRecentDetections(detectRes.value.data || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [handleSessionExpired]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const totalCameras = cameras.length;
  const activeCameras = cameras.filter(isCameraOnline).length;
  const todayDetectionsCount = recentDetections.length;

  const statCards = [
    {
      key: 'total',
      title: 'กล้องทั้งหมด',
      icon: '📹',
      value: totalCameras,
      subText: 'เชื่อมต่อในระบบ',
    },
    {
      key: 'online',
      title: 'กล้องพร้อมใช้งาน',
      icon: '🟢',
      value: activeCameras,
      valueColor: '#16a34a',
      subText: `จากทั้งหมด ${totalCameras} ตัว`,
    },
    {
      key: 'detections',
      title: 'ตรวจพบวันนี้',
      icon: '🔥',
      value: todayDetectionsCount,
      valueColor: '#dc2626',
      subText: 'รายการตรวจจับล่าสุด',
    },
    {
      key: 'system',
      title: 'สถานะระบบ',
      icon: '🛡️',
      value: 'กำลังเฝ้าระวัง',
      valueColor: '#2563eb',
      valueFontSize: '20px',
      subText: 'Real-time Monitoring Active',
    },
  ];

  return (
    <MainLayout
      title="Fire Detection Dashboard"
      username={user?.username || 'User'}
      userRole={user?.role || 'user'}
    >
      <div style={styles.page}>
        {/* Stat Cards */}
        <div style={styles.statsGrid}>
          {statCards.map(({ key, title, icon, value, valueColor, valueFontSize, subText }) => (
            <div key={key} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>{title}</span>
                <span style={styles.cardIcon}>{icon}</span>
              </div>
              <div style={{ ...styles.cardValue, color: valueColor, fontSize: valueFontSize }}>
                {value}
              </div>
              <div style={styles.cardSubText}>{subText}</div>
            </div>
          ))}
        </div>

        {/* 2-Column Split View เพื่อสัดส่วนที่สมดุล */}
        <div style={styles.splitGrid}>
          {/* Left Column: Recent Detections */}
          <div style={styles.tableCard}>
            <div style={styles.cardHeaderPadding}>
              <h3 style={styles.containerTitle}>🔥 เหตุการณ์ตรวจจับล่าสุด</h3>
              <span style={styles.badgeLive}>Live</span>
            </div>

            {loading ? (
              <p style={styles.loadingText}>กำลังโหลดข้อมูล...</p>
            ) : recentDetections.length === 0 ? (
              <p style={styles.emptyState}>ไม่พบเหตุการณ์ผิดปกติในขณะนี้</p>
            ) : (
              <div style={styles.tableScroll}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeadRow}>
                      <th style={styles.th}>ประเภท</th>
                      <th style={styles.th}>ความมั่นใจ</th>
                      <th style={styles.th}>Camera ID</th>
                      <th style={styles.th}>เวลา</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDetections.slice(0, 5).map((item, index) => (
                      <tr key={item.event_id || index} style={styles.tableRow}>
                        <td style={styles.td}>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: item.detection_type === 'fire' ? '#fee2e2' : '#f1f5f9',
                              color: item.detection_type === 'fire' ? '#b91c1c' : '#475569',
                            }}
                          >
                            {item.detection_type?.toUpperCase()}
                          </span>
                        </td>
                        <td style={styles.tdMedium}>
                          {typeof item.confidence === 'number' ? `${(item.confidence * 100).toFixed(1)}%` : '-'}
                        </td>
                        <td style={styles.tdMono}>
                          {item.camera_id ? item.camera_id : '-'}
                        </td>
                        <td style={styles.td}>
                          {item.created_at ? new Date(item.created_at).toLocaleTimeString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Registered Cameras */}
          <div style={styles.tableCard}>
            <div style={styles.cardHeaderPadding}>
              <h3 style={styles.containerTitle}>📷 สถานะกล้องที่ลงทะเบียน</h3>
            </div>

            {loading ? (
              <p style={styles.loadingText}>กำลังโหลดข้อมูลกล้อง...</p>
            ) : cameras.length === 0 ? (
              <p style={styles.emptyState}>ไม่พบข้อมูลกล้อง</p>
            ) : (
              <div style={styles.tableScroll}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeadRow}>
                      <th style={styles.th}>Camera ID</th>
                      <th style={styles.th}>Location</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cameras.map((cam) => (
                      <tr key={cam.camera_id} style={styles.tableRow}>
                        <td style={styles.tdMono}>{cam.camera_id}</td>
                        <td style={styles.td}>
                          <div style={styles.locationText}>{cam.location || '-'}</div>
                          <div style={styles.subLocationText}>{cam.sub_location || '-'}</div>
                        </td>
                        <td style={styles.td}>
                          <StatusBadge status={cam.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

const STATUS_BADGE_STYLES = {
  active: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
  inactive: { bg: '#fee2e2', color: '#b91c1c', label: 'Inactive' },
  maintenance: { bg: '#fef3c7', color: '#b45309', label: 'Maintenance' },
};

const StatusBadge = ({ status }) => {
  const current = STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.inactive;
  return (
    <span
      style={{
        backgroundColor: current.bg,
        color: current.color,
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
      }}
    >
      {current.label}
    </span>
  );
};

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: '24px' },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIcon: { fontSize: '20px' },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
  },
  cardValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a',
    marginTop: '8px',
  },
  cardSubText: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '4px',
  },

  // แบ่งสัดส่วนตารางเป็น 2 คอลัมน์แบบสมดุล
  splitGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: '24px',
    alignItems: 'start',
  },

  tableCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  cardHeaderPadding: {
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
  },
  containerTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
  },
  badgeLive: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    fontSize: '12px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '12px',
  },

  locationText: { fontWeight: '500', color: '#1e293b' },
  subLocationText: { fontSize: '12px', color: '#64748b' },

  tableScroll: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  tableHeadRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' },
  th: { padding: '14px 16px', fontSize: '13px' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 16px' },
  tdMedium: { padding: '14px 16px', fontWeight: '500' },
  tdMono: { padding: '14px 16px', fontFamily: 'monospace', color: '#64748b', fontSize: '13px' },
  emptyState: { padding: '32px', textAlign: 'center', color: '#94a3b8' },
  loadingText: { padding: '32px', textAlign: 'center', color: '#64748b' },
};

export default Dashboard;